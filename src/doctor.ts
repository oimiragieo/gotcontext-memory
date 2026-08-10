import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.js";
import { parseFrontmatter } from "./frontmatter.js";
import { fileExists } from "./hash.js";
import { scan } from "./secrets.js";
import type { MemoryStore } from "./store.js";
import { BYTE_CAP, LINE_CAP, countIndexLines } from "./store.js";

export type DoctorReport = {
  root: string;
  memoryTreeHash: string;
  ok: boolean;
  checks: Array<{
    name: string;
    status: "pass" | "fail" | "EMPTY" | "COULD_NOT_MEASURE" | "PARTIAL";
    detail?: string;
  }>;
};

export async function runDoctor(store: MemoryStore): Promise<DoctorReport> {
  const checks: DoctorReport["checks"] = [];
  let ok = true;

  const cfg = await loadConfig(store.root);
  checks.push({
    name: "config",
    status: "pass",
    detail: `dream.enabled=${cfg.dream.enabled}`,
  });

  // scanner self-test
  const planted = scan("AKIAIOSFODNN7EXAMPLE");
  if (planted.length < 1) {
    ok = false;
    checks.push({
      name: "secret_scanner",
      status: "fail",
      detail: "planted AWS key not detected",
    });
  } else {
    checks.push({
      name: "secret_scanner",
      status: "pass",
      detail: `findings=${planted.length}`,
    });
  }

  const memDir = path.join(store.root, "memory");
  let memCount = 0;
  try {
    const walk = async (dir: string) => {
      const ents = await readdir(dir, { withFileTypes: true });
      for (const e of ents) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) await walk(abs);
        else if (e.name.endsWith(".md")) {
          memCount += 1;
          const raw = await readFile(abs, "utf8");
          parseFrontmatter(raw);
        }
      }
    };
    if (await fileExists(memDir)) await walk(memDir);
    checks.push({
      name: "memories",
      status: memCount === 0 ? "EMPTY" : "pass",
      detail:
        memCount === 0 ? "memories: 0 — EMPTY, proves nothing" : `memories: ${memCount} checked`,
    });
  } catch (err) {
    ok = false;
    checks.push({
      name: "memories",
      status: "fail",
      detail: (err as Error).message,
    });
  }

  const index = await store.read("MEMORY.md");
  if (!index) {
    ok = false;
    checks.push({ name: "index", status: "fail", detail: "MEMORY.md missing" });
  } else {
    const text = index.toString("utf8");
    const lineCount = countIndexLines(text);
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/\((memory\/[^)]+)\)/);
      const target = m?.[1];
      if (!target) continue;
      if (!(await store.read(target))) {
        ok = false;
        checks.push({
          name: "dangling_index",
          status: "fail",
          detail: target,
        });
      }
    }
    const overCap = lineCount > LINE_CAP || index.length > BYTE_CAP;
    if (overCap) ok = false;
    checks.push({
      name: "index_caps",
      status: overCap ? "fail" : "pass",
      detail: `lines=${lineCount}/${LINE_CAP} bytes=${index.length}/${BYTE_CAP}`,
    });
  }

  // corpus partial labels
  checks.push({
    name: "corpus_agy",
    status: "PARTIAL",
    detail: "PARTIAL — no dogfood receipts",
  });
  checks.push({
    name: "corpus_opencode",
    status: "PARTIAL",
    detail: "PARTIAL — no dogfood receipts",
  });

  // Surface accept-failure receipts. Their `code` names the cause (CAS_CONFLICT /
  // SECRET_DETECTED / INDEX_CAP / TARGET_MISSING / INVALID_PROPOSAL /
  // PROPOSAL_EXPIRED / PATH_VIOLATION / INTERNAL_ERROR).
  const receiptsDir = path.join(store.root, "receipts");
  let ents: string[] | null = null;
  try {
    ents = await readdir(receiptsDir);
  } catch {
    // ONLY the directory listing may be swallowed, and only into this one row.
    // Previously this handler also wrapped every per-receipt readFile, so a single
    // unreadable receipt reported "receipts dir absent" — a false, reassuring claim
    // that ALSO dropped every remaining error receipt on the floor.
    ents = null;
  }
  if (ents === null) {
    checks.push({
      name: "accept_error_receipt",
      status: "EMPTY",
      detail: "receipts dir absent",
    });
  } else {
    const drifts = ents.filter((n) => n.endsWith(".error.json"));
    if (drifts.length) {
      ok = false;
      for (const name of drifts) {
        let code: string;
        try {
          const raw = await readFile(path.join(receiptsDir, name), "utf8");
          try {
            code = String(JSON.parse(raw).code ?? "error");
          } catch {
            // A receipt we cannot parse is itself a finding — never let it read as
            // a generic "error" indistinguishable from a real recorded code.
            code = "UNPARSEABLE_RECEIPT";
          }
        } catch (err) {
          code = `UNREADABLE_RECEIPT (${(err as Error).message.slice(0, 60)})`;
        }
        checks.push({
          name: "accept_error_receipt",
          status: "fail",
          detail: `${name}: ${code}`,
        });
      }
    } else {
      checks.push({
        name: "accept_error_receipt",
        status: "pass",
        detail: "receipts: 0 error files",
      });
    }
  }

  const hash = await store.memoryTreeHash();
  return { root: store.root, memoryTreeHash: hash, ok, checks };
}
