export type SecretFinding = { pattern: string; preview: string };

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "aws_access_key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  {
    name: "github_pat",
    re: /\bghp_[A-Za-z0-9]{36,}\b/g,
  },
  {
    name: "generic_api_key",
    re: /\b(?:api[_-]?key|secret)\s*[:=]\s*['"]?sk-[A-Za-z0-9_-]{16,}/gi,
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
