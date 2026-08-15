import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DORMANT_MIN_EXPECTED,
  type EfficacyResult,
  createExpireProposal,
} from "./dream/efficacy.js";
import type { MemoryStore } from "./store.js";

/**
 * HITL decision report — a self-contained report.html a human opens, decides on,
 * and saves back as decisions.json (Chrome File System Access API, no server).
 * `ingest-decisions` reads that file and acts: approvals for expiry candidates
 * file the SAME `expire` proposal createExpireProposal always files (still a
 * proposal, still reviewed at `review accept`); denials record a reason so the
 * item never reappears. The toolkit recommends here too, at every step; it is
 * the human's Approve/Deny that decides.
 */

const DECISIONS_LEDGER = "efficacy/report-decisions.jsonl";

export type ReportItemKind = "expiry" | "dormant" | "persisting" | "undelivered";

export type ReportItem = {
  id: string;
  kind: ReportItemKind;
  notePath: string;
  verdict: string;
  streak: number;
  after_k: number;
  after_n: number;
  /** REVIEW: dormant/persisting notes needing human attention (no recommended
   * action beyond "look at this"). EXPIRE/RETAIN: the expiry-eligibility call. */
  recommendation: "EXPIRE" | "RETAIN" | "REVIEW";
  reason: string;
  /** Plain-text summary of this item, piped to a triage adapter's stdin. */
  text: string;
};

export type ReportDecision = "approve" | "deny";

export function reportItemId(kind: string, notePath: string): string {
  return createHash("sha256").update(`${kind}:${notePath}`).digest("hex").slice(0, 16);
}

/** Efficacy results -> decision items. DORMANT and streak>=2 PERSISTING notes
 * need a human look; RESOLVED-and-expiry-eligible notes carry whatever
 * recommendation measureEfficacy already computed (EXPIRE only when a
 * justification was supplied — see efficacy.ts, "cure vs treatment"). */
export function buildReportItems(results: EfficacyResult[]): ReportItem[] {
  const items: ReportItem[] = [];
  for (const r of results) {
    if (r.verdict === "DORMANT") {
      items.push({
        id: reportItemId("dormant", r.notePath),
        kind: "dormant",
        notePath: r.notePath,
        verdict: r.verdict,
        streak: r.streak,
        after_k: r.after_k,
        after_n: r.after_n,
        recommendation: "REVIEW",
        reason: `zero post-apply hits over ${r.after_n} sessions, but expected exposure was below ${DORMANT_MIN_EXPECTED} — not enough exercise of the failure class to call this fixed (exposure gate, not a contradiction of RESOLVED)`,
        text: `DORMANT ${r.notePath} pattern="${r.pattern}" after_k=${r.after_k} after_n=${r.after_n} then_k=${r.then_k ?? "?"} then_n=${r.then_n ?? "?"} streak=${r.streak}`,
      });
    } else if (r.verdict === "PERSISTING" && r.recommend_deliver) {
      // Delivery before mechanization: a note nobody opened has not actually
      // been tried, so escalating it to a gate skips the cheaper fix.
      items.push({
        id: reportItemId("undelivered", r.notePath),
        kind: "undelivered",
        notePath: r.notePath,
        verdict: r.verdict,
        streak: r.streak,
        after_k: r.after_k,
        after_n: r.after_n,
        recommendation: "REVIEW",
        reason: `PERSISTING x${r.streak} but the note was opened in 0 of ${r.after_n} post-acceptance sessions — this is a DELIVERY failure, not a wording one. Put the rule where it loads without being asked for: the index hook (its \`description\`), a skill description, or a harness gate.`,
        text: `UNDELIVERED ${r.notePath} pattern="${r.pattern}" after_k=${r.after_k} after_n=${r.after_n} reads_post=0 streak=${r.streak}`,
      });
    } else if (r.verdict === "PERSISTING" && r.recommend_mechanize) {
      const readNote =
        r.reads_post != null ? ` (read in ${r.reads_post}/${r.after_n} post-apply sessions)` : "";
      items.push({
        id: reportItemId("persisting", r.notePath),
        kind: "persisting",
        notePath: r.notePath,
        verdict: r.verdict,
        streak: r.streak,
        after_k: r.after_k,
        after_n: r.after_n,
        recommendation: "REVIEW",
        reason: `PERSISTING x${r.streak}${readNote}: the note is not preventing this failure — escalate to a hook/mechanism, do not re-remember`,
        text: `PERSISTING ${r.notePath} pattern="${r.pattern}" after_k=${r.after_k} after_n=${r.after_n} reads_post=${r.reads_post ?? "n/a"} streak=${r.streak}`,
      });
    } else if (r.expiry_recommendation) {
      items.push({
        id: reportItemId("expiry", r.notePath),
        kind: "expiry",
        notePath: r.notePath,
        verdict: r.verdict,
        streak: r.streak,
        after_k: r.after_k,
        after_n: r.after_n,
        recommendation: r.expiry_recommendation,
        reason:
          r.expiry_recommendation === "EXPIRE"
            ? `RESOLVED x${r.streak}, ${r.after_n} post-acceptance sessions, justification: ${r.expiry_justification}`
            : "RESOLVED and expiry-eligible, but no justification (mechanized|environment-changed) " +
              "was supplied — expiring an active treatment would make the failure return unscored",
        text: `EXPIRY-CANDIDATE ${r.notePath} recommendation=${r.expiry_recommendation} streak=${r.streak} after_n=${r.after_n}`,
      });
    }
  }
  return items;
}

export async function loadReportDecisions(
  store: MemoryStore,
): Promise<Map<string, { decision: ReportDecision; reason?: string; at: string }>> {
  const out = new Map<string, { decision: ReportDecision; reason?: string; at: string }>();
  const buf = await store.read(DECISIONS_LEDGER);
  if (!buf) return out;
  for (const line of buf.toString("utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line) as {
        id?: string;
        decision?: ReportDecision;
        reason?: string;
        at?: string;
      };
      if (rec.id && rec.decision) {
        out.set(rec.id, { decision: rec.decision, reason: rec.reason, at: rec.at ?? "" });
      }
    } catch {
      // one corrupt ledger line only loses that line's contribution
    }
  }
  return out;
}

export async function recordReportDecision(
  store: MemoryStore,
  itemId: string,
  decision: ReportDecision,
  reason?: string,
): Promise<void> {
  const buf = await store.read(DECISIONS_LEDGER);
  const prior = buf ? buf.toString("utf8") : "";
  const line = `${JSON.stringify({
    id: itemId,
    decision,
    reason,
    at: new Date().toISOString(),
  })}\n`;
  await store.commitOperational({
    relativePath: DECISIONS_LEDGER,
    body: prior + line,
    scanSecrets: false,
  });
}

async function applyApproval(
  store: MemoryStore,
  item: { kind: string; notePath: string; reason: string },
) {
  if (item.kind === "expiry") {
    await createExpireProposal(store, item.notePath, {
      evidenceQuote: `report-approved EXPIRE: ${item.reason}`,
    });
  }
  // dormant/persisting/undelivered: acknowledgement only. Harness-agnostic —
  // the toolkit never rewrites an index hook, a skill, or a hook on approval.
}

/**
 * Optional triage adapter (council, OPTIONAL — human report is the default).
 * Runs `cmd` with `item.text` on stdin; the LAST line matching
 * /RECOMMENDED:\s*(APPROVE|DENY)/ is that seat's verdict. Any failure — spawn
 * error, non-matching output, non-zero exit with no verdict line — resolves to
 * `null`, which always fails OPEN to the human report.
 */
function runTriageSeat(cmd: string, itemText: string): Promise<"APPROVE" | "DENY" | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v: "APPROVE" | "DENY" | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(cmd, { shell: true });
    } catch {
      finish(null);
      return;
    }
    let out = "";
    child.stdout?.on("data", (d) => {
      out += d;
    });
    child.on("error", () => finish(null));
    child.on("close", () => {
      let verdict: "APPROVE" | "DENY" | null = null;
      for (const line of out.split(/\r?\n/)) {
        const m = line.match(/RECOMMENDED:\s*(APPROVE|DENY)/);
        if (m) verdict = m[1] as "APPROVE" | "DENY";
      }
      finish(verdict);
    });
    try {
      child.stdin?.write(itemText);
      child.stdin?.end();
    } catch {
      // LEGITIMATE SWALLOW: a write failure on a dying process still resolves via
      // the "close" handler above (or "error"); nothing further to do here.
    }
  });
}

/** N seats (array = each its own command) must be UNANIMOUS to auto-decide;
 * anything else — a split, a null (failure), a single non-array command that
 * still returns null — stays for the human report. */
export async function triageItem(
  commands: string | string[] | undefined,
  item: ReportItem,
): Promise<"APPROVE" | "DENY" | null> {
  if (!commands) return null;
  const cmds = Array.isArray(commands) ? commands : [commands];
  if (cmds.length === 0) return null;
  const verdicts = await Promise.all(cmds.map((c) => runTriageSeat(c, item.text)));
  if (verdicts.some((v) => v === null)) return null;
  if (verdicts.every((v) => v === "APPROVE")) return "APPROVE";
  if (verdicts.every((v) => v === "DENY")) return "DENY";
  return null;
}

/** Writes report.html to an absolute, caller-resolved path outside the store —
 * the same "audited external I/O" perimeter portability.ts uses for archives. */
export async function writeReportHtml(outPath: string, html: string): Promise<void> {
  if (!path.isAbsolute(outPath)) {
    throw new Error("report output path must be absolute");
  }
  await writeFile(outPath, html, "utf8");
}

export async function generateReport(
  store: MemoryStore,
  results: EfficacyResult[],
  opts: { triageCommand?: string | string[] } = {},
): Promise<{
  html: string;
  pending: ReportItem[];
  autoApproved: ReportItem[];
  autoDenied: ReportItem[];
}> {
  const all = buildReportItems(results);
  const decided = await loadReportDecisions(store);
  const undecided = all.filter((i) => !decided.has(i.id));

  const pending: ReportItem[] = [];
  const autoApproved: ReportItem[] = [];
  const autoDenied: ReportItem[] = [];
  for (const item of undecided) {
    const verdict = opts.triageCommand ? await triageItem(opts.triageCommand, item) : null;
    if (verdict === "APPROVE") {
      await applyApproval(store, item);
      await recordReportDecision(store, item.id, "approve", "council: unanimous APPROVE");
      autoApproved.push(item);
    } else if (verdict === "DENY") {
      await recordReportDecision(store, item.id, "deny", "council: unanimous DENY");
      autoDenied.push(item);
    } else {
      pending.push(item);
    }
  }

  return { html: renderHtml(pending), pending, autoApproved, autoDenied };
}

/**
 * Self-contained: no external CSS/JS, no network calls, opens from file://.
 * Palette / accessibility contract (measured, not eyeballed):
 *   bg #0d1117, panel #161b22, panel-2 #1c2129, border #2d333b, text #e6edf3,
 *   secondary #a3adbb, accent #2f6feb, ok #1a7f37, danger #c93c3e, warn #e3b341.
 * `ok` is deliberately #1a7f37, NOT the brighter #2ea043 — #2ea043 with white
 * text measures 3.4:1 and fails WCAG AA; #1a7f37 clears it.
 */
function renderHtml(items: ReportItem[]): string {
  const payload = JSON.stringify(items);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>gotcontext-memory — decision report</title>
<style>
  :root {
    --bg: #0d1117;
    --panel: #161b22;
    --panel-2: #1c2129;
    --border: #2d333b;
    --text: #e6edf3;
    --secondary: #a3adbb;
    --accent: #2f6feb;
    --ok: #1a7f37;
    --danger: #c93c3e;
    --warn: #e3b341;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; overflow-x: hidden; }
  body {
    background: var(--bg);
    color: var(--text);
    font: 14px/1.5 -apple-system, "Segoe UI", system-ui, sans-serif;
    padding: 24px 16px 96px;
  }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p.sub { color: var(--secondary); margin: 0 0 20px; }
  .item {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 12px;
    max-width: 100%;
  }
  .item-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .path { font-family: ui-monospace, Consolas, monospace; word-break: break-all; }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .badge-danger { background: var(--danger); color: #fff; }
  .badge-ok { background: var(--ok); color: #fff; }
  .badge-warn { background: var(--warn); color: #241c04; }
  .reason { color: var(--secondary); margin: 6px 0 12px; }
  .segmented {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    min-height: 32px;
  }
  .segmented button {
    background: var(--panel-2);
    color: var(--text);
    border: none;
    border-right: 1px solid var(--border);
    padding: 0 14px;
    min-height: 32px;
    cursor: pointer;
    font: inherit;
  }
  .segmented button:last-child { border-right: none; }
  .segmented:has(button.sel-approve[aria-pressed="true"]) button.sel-approve,
  .segmented button.sel-approve[aria-pressed="true"] { background: var(--ok); color: #fff; }
  .segmented button.sel-deny[aria-pressed="true"] { background: var(--danger); color: #fff; }
  .segmented button.sel-defer[aria-pressed="true"] { background: var(--accent); color: #fff; }
  .segmented button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .reason-input {
    display: none;
    width: 100%;
    margin-top: 8px;
    background: var(--panel-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px;
    font: inherit;
  }
  .item.deny-active .reason-input { display: block; }
  #savebar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--panel);
    border-top: 1px solid var(--border);
    padding: 12px 16px;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  #save {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    min-height: 32px;
    cursor: pointer;
    font: inherit;
  }
  #save:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
  #status { color: var(--secondary); }
  @media (max-width: 640px) {
    .badge { white-space: normal; }
  }
</style>
</head>
<body>
<h1>Decision report</h1>
<p class="sub">Approve / Deny / Defer each item. Deny requires a reason. Save writes
decisions.json locally — nothing here talks to a server.</p>
<div id="items"></div>
<div id="savebar">
  <button id="save" type="button">Save decisions.json</button>
  <span id="status"></span>
</div>
<script>
(function () {
  var ITEMS = ${payload};
  var container = document.getElementById("items");
  ITEMS.forEach(function (item) {
    var el = document.createElement("div");
    el.className = "item";
    el.dataset.id = item.id;
    var badgeClass = item.recommendation === "EXPIRE" ? "badge-danger"
      : item.recommendation === "RETAIN" ? "badge-ok" : "badge-warn";
    el.innerHTML =
      '<div class="item-head">' +
        '<span class="path">' + escapeHtml(item.notePath) + '</span>' +
        '<span class="badge ' + badgeClass + '">' + escapeHtml(item.recommendation) + '</span>' +
        '<span class="badge" style="background:var(--panel-2);color:var(--secondary)">' + escapeHtml(item.kind) + '</span>' +
      '</div>' +
      '<div class="reason">' + escapeHtml(item.reason) + '</div>' +
      '<div class="segmented" role="group" aria-label="decision">' +
        '<button type="button" class="sel-approve" aria-pressed="false">Approve</button>' +
        '<button type="button" class="sel-deny" aria-pressed="false">Deny</button>' +
        '<button type="button" class="sel-defer" aria-pressed="false">Defer</button>' +
      '</div>' +
      '<textarea class="reason-input" placeholder="Reason for denial (required)"></textarea>';
    container.appendChild(el);
    var buttons = el.querySelectorAll(".segmented button");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        el.classList.toggle("deny-active", btn.classList.contains("sel-deny"));
      });
    });
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function collect() {
    var out = [];
    container.querySelectorAll(".item").forEach(function (el) {
      var sel = el.querySelector('[aria-pressed="true"]');
      var action = sel
        ? (sel.classList.contains("sel-approve") ? "approve"
          : sel.classList.contains("sel-deny") ? "deny" : "defer")
        : "defer";
      var item = ITEMS.find(function (i) { return i.id === el.dataset.id; });
      var reason = el.querySelector(".reason-input").value.trim();
      out.push({
        id: item.id,
        kind: item.kind,
        notePath: item.notePath,
        action: action,
        reason: reason || undefined,
      });
    });
    return out;
  }

  document.getElementById("save").addEventListener("click", async function () {
    var status = document.getElementById("status");
    var decisions = collect();
    for (var i = 0; i < decisions.length; i++) {
      if (decisions[i].action === "deny" && !decisions[i].reason) {
        status.textContent = "Deny requires a reason: " + decisions[i].notePath;
        return;
      }
    }
    var payload = JSON.stringify({ generatedAt: new Date().toISOString(), items: decisions }, null, 2);
    try {
      if (window.showSaveFilePicker) {
        var handle = await window.showSaveFilePicker({
          suggestedName: "decisions.json",
          types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
        });
        var writable = await handle.createWritable();
        await writable.write(payload);
        await writable.close();
        status.textContent = "Saved.";
      } else {
        var blob = new Blob([payload], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "decisions.json";
        a.click();
        status.textContent = "Downloaded (showSaveFilePicker unavailable).";
      }
    } catch (err) {
      status.textContent = "Save cancelled or failed: " + (err && err.message ? err.message : err);
    }
  });
})();
</script>
</body>
</html>
`;
}

export type DecisionEntry = {
  id: string;
  kind: string;
  notePath: string;
  action: "approve" | "deny" | "defer";
  reason?: string;
};

/**
 * Consume a saved decisions.json. `file` must be a BASENAME ONLY — no path
 * separators, no `..` — resolved under `cwd`, closing path traversal. After
 * every decision lands the file is renamed to `<name>.done` so a re-run can
 * never double-fire (the original name is simply gone).
 */
export async function ingestDecisions(
  store: MemoryStore,
  file: string,
  cwd: string = process.cwd(),
): Promise<{ approved: number; denied: number; deferred: number }> {
  const base = path.basename(file);
  if (base !== file || base === "" || base === "." || base === "..") {
    throw new Error(
      `ingest-decisions requires a basename-only file reference (no path segments): ${file}`,
    );
  }
  const abs = path.join(cwd, base);
  const raw = await readFile(abs, "utf8");
  let parsed: { items?: DecisionEntry[] };
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`decisions file is not valid JSON: ${(err as Error).message}`);
  }
  const entries = Array.isArray(parsed.items) ? parsed.items : [];

  let approved = 0;
  let denied = 0;
  let deferred = 0;
  for (const d of entries) {
    if (!d || typeof d.id !== "string" || typeof d.notePath !== "string") continue;
    if (d.action === "deny") {
      if (!d.reason || !d.reason.trim()) {
        throw new Error(`deny requires a reason: ${d.id} (${d.notePath})`);
      }
      await recordReportDecision(store, d.id, "deny", d.reason);
      denied += 1;
    } else if (d.action === "approve") {
      await applyApproval(store, { kind: d.kind, notePath: d.notePath, reason: d.reason ?? "" });
      await recordReportDecision(store, d.id, "approve", d.reason);
      approved += 1;
    } else {
      deferred += 1; // no ledger write — stays pending for the next report
    }
  }

  const done = `${abs}.done`;
  await rm(done, { force: true });
  await rename(abs, done);

  return { approved, denied, deferred };
}
