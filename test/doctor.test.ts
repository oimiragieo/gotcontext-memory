import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runDoctor } from "../src/doctor.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

describe("doctor", () => {
  it("healthy store names checks; empty memories labeled EMPTY", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    const report = await runDoctor(store);
    expect(await store.memoryTreeHash()).toBe(before);
    expect(report.checks.some((c) => c.name === "secret_scanner")).toBe(true);
    const mem = report.checks.find((c) => c.name === "memories");
    expect(mem?.status).toBe("EMPTY");
    expect(mem?.detail).toMatch(/EMPTY, proves nothing/);
  });

  it("dangling MEMORY.md entry fails by path", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc2-"));
    const store = await MemoryStore.initStore(root);
    await writeFile(
      path.join(root, "MEMORY.md"),
      "# Memory index\n\n- [Gone](memory/missing.md) — hook\n",
      "utf8",
    );
    const report = await runDoctor(store);
    expect(report.ok).toBe(false);
    expect(
      report.checks.some((c) => c.name === "dangling_index" && c.detail === "memory/missing.md"),
    ).toBe(true);
  });

  it("control: seeded memory passes memories check", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc3-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "---\ntitle: A\ndescription: d\n---\n\nx\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const report = await runDoctor(store);
    const mem = report.checks.find((c) => c.name === "memories");
    expect(mem?.status).toBe("pass");
    expect(mem?.detail).toMatch(/1 checked/);
    const caps = report.checks.find((c) => c.name === "index_caps");
    expect(caps?.status).toBe("pass");
  });

  it("over-cap MEMORY.md fails index_caps", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc-cap-"));
    const store = await MemoryStore.initStore(root);
    const huge = `# Memory index\n\n${Array.from({ length: 210 }, (_, i) => `- [N${i}](memory/n${i}.md) — d`).join("\n")}\n`;
    await writeFile(path.join(root, "MEMORY.md"), huge, "utf8");
    const report = await runDoctor(store);
    expect(report.ok).toBe(false);
    const caps = report.checks.find((c) => c.name === "index_caps");
    expect(caps?.status).toBe("fail");
  });
});
