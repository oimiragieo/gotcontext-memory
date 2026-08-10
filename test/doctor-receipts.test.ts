import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runDoctor } from "../src/doctor.js";
import { MemoryStore } from "../src/store.js";

/**
 * doctor's receipts check wrapped readdir AND every per-receipt readFile in ONE
 * try/catch whose handler reported `status: "EMPTY", detail: "receipts dir absent"`.
 * So a single unreadable receipt made a health check state something false and
 * reassuring — and silently dropped every remaining error receipt. A health check
 * that can report "absent" when the directory is full is the false-green class.
 */
async function storeWithReceipts(files: Record<string, string>) {
  const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc-"));
  const store = await MemoryStore.initStore(root);
  const dir = path.join(root, "receipts");
  await mkdir(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    await writeFile(path.join(dir, name), body, "utf8");
  }
  return { store, root };
}

describe("doctor receipts check", () => {
  it("reports every error receipt, and a malformed one does not hide the others", async () => {
    const { store } = await storeWithReceipts({
      "a.error.json": JSON.stringify({ id: "a", code: "CAS_CONFLICT" }),
      "b.error.json": "{ this is not json",
      "c.error.json": JSON.stringify({ id: "c", code: "SECRET_DETECTED" }),
    });
    const report = await runDoctor(store);
    const rows = report.checks.filter((c) => c.name === "accept_error_receipt");

    // all three surfaced — the malformed one must not swallow c
    expect(rows.length).toBe(3);
    expect(report.ok).toBe(false);
    const details = rows.map((r) => r.detail).join(" | ");
    expect(details).toContain("CAS_CONFLICT");
    expect(details).toContain("SECRET_DETECTED");
    // the unparseable receipt is NAMED as unparseable, not silently labelled "error"
    expect(details).toMatch(/UNPARSEABLE/i);
    // and nothing claims the directory is absent
    expect(details).not.toMatch(/absent/i);
  });

  it("a genuinely absent receipts dir still reports EMPTY (positive control)", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc2-"));
    const store = await MemoryStore.initStore(root);
    // initStore always creates receipts/, so the "absent" branch is only reachable
    // once it is removed — which is exactly why that handler firing for ANY other
    // reason was reporting something that could not otherwise be true.
    const { rm } = await import("node:fs/promises");
    await rm(path.join(root, "receipts"), { recursive: true, force: true });
    const report = await runDoctor(store);
    const row = report.checks.find((c) => c.name === "accept_error_receipt");
    expect(row?.status).toBe("EMPTY");
    expect(row?.detail).toMatch(/absent/i);
  });

  it("receipts present but no error files reports pass", async () => {
    const { store } = await storeWithReceipts({ "ok.json": JSON.stringify({ id: "ok" }) });
    const report = await runDoctor(store);
    const row = report.checks.find((c) => c.name === "accept_error_receipt");
    expect(row?.status).toBe("pass");
  });
});
