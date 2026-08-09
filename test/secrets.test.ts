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
      "-----BEGIN PRIVATE KEY-----",
    ].join("\n");
    const findings = scan(planted);
    expect(findings.length).toBeGreaterThanOrEqual(4);
  });
});
