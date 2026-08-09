import { mkdtemp, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../src/hash.js";
import { assertSafeRelativePath } from "../src/paths.js";
import {
  BASE_ABSENT,
  CasConflict,
  MemoryStore,
  checkIndexCaps,
  countIndexLines,
} from "../src/store.js";

describe("path containment arms", () => {
  it("rejects absolute, drive, and UNC-shaped relatives", () => {
    expect(() => assertSafeRelativePath("/etc/passwd")).toThrow(/Path containment/);
    expect(() => assertSafeRelativePath("C:\\Windows\\x")).toThrow(/Path containment/);
    expect(() => assertSafeRelativePath("\\\\server\\share")).toThrow(/Path containment/);
    expect(() => assertSafeRelativePath("~/secret")).toThrow(/Path containment/);
  });

  it("rejects symlink escape under store", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-sym-"));
    const outside = await mkdtemp(path.join(os.tmpdir(), "gcm-out-"));
    await writeFile(path.join(outside, "leak.md"), "outside\n");
    const store = await MemoryStore.initStore(root);
    const link = path.join(root, "memory", "escape-link");
    try {
      await symlink(outside, link, "dir");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EPERM" || code === "EACCES" || code === "ENOTSUP") {
        return;
      }
      throw err;
    }
    await expect(
      store.commitCanonical({
        relativePath: "memory/escape-link/leak.md",
        body: "pwn\n",
        baseHash: BASE_ABSENT,
        provenance: { authored_by: "human" },
      }),
    ).rejects.toThrow(/Symlink escape|Path containment|Path escapes/);
  });
});

describe("index line counting", () => {
  it("CR-only separators count as lines for LINE_CAP", () => {
    const body = Array.from({ length: 201 }, (_, i) => `L${i}`).join("\r");
    expect(countIndexLines(body)).toBe(201);
    expect(() => checkIndexCaps(body)).toThrow(/IndexCapExceeded/);
  });
});

describe("delete + rollback", () => {
  it("deleteCanonical removes file; stale base refuses; rollback restores", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-del-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/x.md",
      body: "v1\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const h1 = sha256Hex("v1\n");
    await store.commitCanonical({
      relativePath: "memory/x.md",
      body: "v2\n",
      baseHash: h1,
      provenance: { authored_by: "human" },
    });
    await expect(
      store.deleteCanonical({
        relativePath: "memory/x.md",
        baseHash: h1,
        provenance: { authored_by: "human" },
      }),
    ).rejects.toBeInstanceOf(CasConflict);
    await store.deleteCanonical({
      relativePath: "memory/x.md",
      baseHash: sha256Hex("v2\n"),
      provenance: { authored_by: "human" },
    });
    expect(await store.read("memory/x.md")).toBeNull();
    await store.commitCanonical({
      relativePath: "memory/x.md",
      body: "v3\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const hist = await store.history("memory/x.md");
    expect(hist.length).toBeGreaterThan(0);
    const meta = hist.find((h) => h.meta);
    expect(meta?.meta).toBeTruthy();
    await store.rollback("memory/x.md", hist[0]?.hash.slice(0, 8), {
      authored_by: "human",
    });
    const body = await store.read("memory/x.md");
    expect(body).not.toBeNull();
  });
});
