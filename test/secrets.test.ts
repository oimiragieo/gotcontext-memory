import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SecretDetected, scan } from "../src/secrets.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

describe("secret scan gate — pattern arms", () => {
  it("rejects github PAT, generic sk-, and PEM header; tree unchanged", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-sec2-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    const cases = [
      `token ghp_${"a".repeat(36)}`,
      "api_key: sk-abcdefghijklmnopqrstuvwxyz",
      "-----BEGIN RSA PRIVATE KEY-----\nMIIE\n",
    ];
    for (const body of cases) {
      await expect(
        store.commitCanonical({
          relativePath: "memory/leak.md",
          body,
          baseHash: BASE_ABSENT,
          provenance: { authored_by: "agent" },
        }),
      ).rejects.toBeInstanceOf(SecretDetected);
    }
    expect(await store.memoryTreeHash()).toBe(before);
  });

  it("allowlist from config permits named pattern and records in revision meta", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-alw-"));
    const store = await MemoryStore.initStore(root);
    await writeFile(
      path.join(root, "config.json"),
      `${JSON.stringify({
        dream: { enabled: false, policy: {} },
        memory: { policy: {} },
        secrets: { allowlist: ["aws_access_key"] },
      })}\n`,
    );
    await store.reloadConfig();
    await store.commitCanonical({
      relativePath: "memory/ok.md",
      body: "key AKIAIOSFODNN7EXAMPLE leftover\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    await store.commitCanonical({
      relativePath: "memory/ok.md",
      body: "key AKIAIOSFODNN7EXAMPLE leftover2\n",
      baseHash: await store.currentHash("memory/ok.md"),
      provenance: { authored_by: "human" },
    });
    const hist = await store.history("memory/ok.md");
    expect(hist.some((h) => Array.isArray(h.meta?.allowlist))).toBe(true);
  });

  it("scanner self-test: fixture corpus yields ≥1 findings", () => {
    const planted = [
      "AKIAIOSFODNN7EXAMPLE",
      `ghp_${"b".repeat(36)}`,
      "api_key: sk-abcdefghijklmnopqrstuvwxyz0123",
      "sk-proj-abcdefghijklmnopqrstuvwxyz0123456789",
      "OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz0123",
      "-----BEGIN PRIVATE KEY-----",
    ].join("\n");
    const findings = scan(planted);
    expect(findings.length).toBeGreaterThanOrEqual(5);
  });

  it("clean body commits (bidirectional control)", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-sec-clean-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    await store.commitCanonical({
      relativePath: "memory/clean.md",
      body: "Prefer conventional commits and short status updates.\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    expect(await store.memoryTreeHash()).not.toBe(before);
  });

  it("bare sk-proj and ENV=sk forms are rejected", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-sec-sk-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    await expect(
      store.commitCanonical({
        relativePath: "memory/leak.md",
        body: "token sk-proj-abcdefghijklmnopqrstuvwxyz0123456789\n",
        baseHash: BASE_ABSENT,
        provenance: { authored_by: "agent" },
      }),
    ).rejects.toBeInstanceOf(SecretDetected);
    await expect(
      store.commitCanonical({
        relativePath: "memory/leak2.md",
        body: "OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz0123\n",
        baseHash: BASE_ABSENT,
        provenance: { authored_by: "agent" },
      }),
    ).rejects.toBeInstanceOf(SecretDetected);
    expect(await store.memoryTreeHash()).toBe(before);
  });
});

describe("secrets: current-generation token formats", () => {
  // Red arm: each of these was NOT detected before 2026-08-09. Fabricated values.
  const cases: Array<[string, string]> = [
    ["github_pat_fine_grained", "github_pat_11ABCDEFG0aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789"],
    ["gitlab_pat", "glpat-ABCDEFghijkl1234567890"],
    ["slack_token", ["xoxb-", "0000000000-", "TESTONLYFAKESECRET00"].join("")],
    ["google_api_key", `AIza${"A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r"}`],
    ["npm_token", `npm_${"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8"}`],
    ["stripe_secret", "sk_live_ABCDEFGHIJKLMNOP1234"],
    ["anthropic_key", "sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWX"],
  ];
  for (const [name, sample] of cases) {
    it(`detects ${name}`, () => {
      const found = scan(`token: ${sample}`);
      expect(found.map((f) => f.pattern)).toContain(name);
    });
  }

  it("does not fire on ordinary prose (guard against a blocking false positive)", () => {
    expect(scan("Please remember: from now on, always run the tests before committing.")).toEqual(
      [],
    );
    expect(scan("the npm_config value and my github_patch notes are fine")).toEqual([]);
  });
});
