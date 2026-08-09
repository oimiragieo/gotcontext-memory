export type SecretFinding = { pattern: string; preview: string };

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "aws_access_key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  {
    name: "github_pat",
    re: /\bghp_[A-Za-z0-9]{36,}\b/g,
  },
  {
    // GitHub's fine-grained PAT, the default issued format since 2022. It shares no
    // substring with `ghp_`, so the classic pattern above never matched it.
    name: "github_pat_fine_grained",
    re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  },
  { name: "gitlab_pat", re: /\bglpat-[A-Za-z0-9_-]{16,}\b/g },
  { name: "slack_token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: "google_api_key", re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: "npm_token", re: /\bnpm_[A-Za-z0-9]{36}\b/g },
  { name: "stripe_secret", re: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/g },
  { name: "anthropic_key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  {
    name: "generic_api_key",
    re: /\b(?:api[_-]?key|secret)\s*[:=]\s*['"]?sk-[A-Za-z0-9_-]{16,}/gi,
  },
  {
    name: "openai_sk",
    re: /\b(?:sk-proj-|sk-)[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: "env_sk",
    re: /\b[A-Z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN)\s*=\s*['"]?sk-[A-Za-z0-9_-]{16,}/gi,
  },
  {
    name: "private_key_pem",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
];

export function scan(text: string, allowlist: string[] = []): SecretFinding[] {
  const allowed = new Set(allowlist);
  const findings: SecretFinding[] = [];
  for (const { name, re } of PATTERNS) {
    if (allowed.has(name)) continue;
    re.lastIndex = 0;
    const m = text.match(re);
    if (m) {
      findings.push({ pattern: name, preview: `${m[0].slice(0, 12)}…` });
    }
  }
  return findings;
}

export class SecretDetected extends Error {
  findings: SecretFinding[];
  constructor(findings: SecretFinding[]) {
    super(`SecretDetected: ${findings.map((f) => f.pattern).join(", ")}`);
    this.name = "SecretDetected";
    this.findings = findings;
  }
}
