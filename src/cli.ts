#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { agyCorpus } from "./corpus/agy.js";
import { claudeCorpus } from "./corpus/claude.js";
import { codexCorpus } from "./corpus/codex.js";
import { cursorCorpus } from "./corpus/cursor.js";
import { opencodeCorpus } from "./corpus/opencode.js";
import { type CorpusSourceName, defaultCorpusRoots } from "./corpus/roots.js";
import { corpusScanLabel } from "./corpus/types.js";
import { runDoctor } from "./doctor.js";
import { digestRoots } from "./dream/digest.js";
import { measureEfficacy } from "./dream/efficacy.js";
import { runDreamFromDigests } from "./dream/run.js";
import { measureUsage } from "./dream/usage.js";
import { fileExists } from "./hash.js";
import { installFragments, uninstallFragments } from "./installer.js";
import { runMcpServer } from "./mcp/server.js";
import { projectStoreRoot, userStoreRoot } from "./paths.js";
import { exportStore, importStore } from "./portability.js";
import { acceptProposal, listProposals, rejectProposal } from "./review.js";
import { MemoryStore } from "./store.js";

async function openStore(storeFlag?: string, cwd = process.cwd()) {
  const project = projectStoreRoot(cwd);
  const user = userStoreRoot();
  if (storeFlag === "project") {
    if (!(await fileExists(project))) {
      throw new Error("Project store missing. Run: gotcontext-memory init --project");
    }
    const s = new MemoryStore(project);
    await s.reloadConfig();
    return s;
  }
  if (storeFlag === "user") {
    const s = new MemoryStore(user);
    await s.reloadConfig();
    return s;
  }
  if (await fileExists(project)) {
    throw new Error("Ambiguous store. Pass --store user|project");
  }
  const s = new MemoryStore(user);
  await s.reloadConfig();
  return s;
}

export function buildCli(): Command {
  const program = new Command();
  program
    .name("gotcontext-memory")
    .description("Disk-canonical markdown memory + HITL dreaming for multiple coding agents")
    .option("--store <tier>", "user|project");

  program
    .command("init")
    .option("--project", "initialize .gotcontext in cwd")
    .option("--dry-run", "print plan only")
    .option("--force", "overwrite tampered managed blocks")
    .option("--mcp", "note MCP enablement (use `mcp` command to serve)")
    .action(async (opts) => {
      const root = opts.project ? projectStoreRoot(process.cwd()) : userStoreRoot();
      if (opts.dryRun) {
        console.log(`Would init store at ${root}`);
        const { planned } = await installFragments({
          dryRun: true,
          storeHint: root,
          storeRoot: root,
          force: !!opts.force,
          skipHomeAdapters: !!opts.project,
        });
        console.log(planned.join("\n"));
        return;
      }
      await MemoryStore.initStore(root);
      const store = new MemoryStore(root);
      await store.reloadConfig();
      const before = await store.memoryTreeHash();
      const { planned, manifest } = await installFragments({
        dryRun: false,
        storeHint: root,
        storeRoot: root,
        force: !!opts.force,
        skipHomeAdapters: !!opts.project,
      });
      await store.commitOperational({
        relativePath: "installer-manifest.json",
        body: `${JSON.stringify({ entries: manifest }, null, 2)}\n`,
        scanSecrets: false,
      });
      const after = await store.memoryTreeHash();
      if (before !== after) {
        throw new Error("init mutated memoryTreeHash unexpectedly");
      }
      console.log(`Initialized store at ${root}`);
      console.log(`Adapters touched:\n${planned.join("\n")}`);
      if (opts.mcp) console.log("MCP: run `gotcontext-memory mcp` to serve");
      console.log(
        "Prefer binary `gotcontext-memory` (gcm may collide with Git Credential Manager).",
      );
    });

  program
    .command("uninstall")
    .description("Remove managed adapter fragments using installer manifest")
    .action(async () => {
      const global = program.opts();
      const store = await openStore(global.store);
      const restored = await uninstallFragments({ store });
      console.log(JSON.stringify({ restored }, null, 2));
    });

  program
    .command("dream")
    .option("--source <name>", "claude|codex|cursor|agy|opencode|all", "all")
    .option("--scope <tier>", "user|project")
    .option("--force", "run even when dream.enabled is false")
    .option(
      "--max-sessions <n>",
      "newest sessions per source to consider (bounds memory AND keeps prevalence meaningful)",
      "400",
    )
    .action(async (opts) => {
      const global = program.opts();
      const store = await openStore(global.store ?? opts.scope);
      const cfg = await loadConfig(store.root);
      if (!cfg.dream.enabled && !opts.force) {
        console.error(
          "dream.enabled is false; pass --force to run, or set dream.enabled true in config.json",
        );
        process.exitCode = 1;
        return;
      }
      const scope = (opts.scope ?? global.store ?? "user") as "user" | "project";
      const sources = {
        claude: claudeCorpus,
        codex: codexCorpus,
        cursor: cursorCorpus,
        agy: agyCorpus,
        opencode: opencodeCorpus,
      } as const;
      const selected =
        opts.source === "all"
          ? (Object.keys(sources) as CorpusSourceName[])
          : ([opts.source] as CorpusSourceName[]).filter((k) => k in sources);
      let scanned = 0;
      let included = 0;
      let excluded = 0;
      // Digests, not transcripts. Accumulating parsed transcripts is what made a
      // real corpus (9.6 GB here, one 2.3 GB file) impossible to dream over at all.
      const digests = [];
      let truncated = 0;
      const sourceSummaries: Array<{
        name: string;
        label: string;
        scanned: number;
        included: number;
        malformed: number;
        truncated: number;
      }> = [];
      for (const name of selected) {
        const roots = defaultCorpusRoots(name);
        const result = await digestRoots({
          roots,
          source: name,
          projectKey: scope === "project" ? path.basename(process.cwd()) : undefined,
          // Bounded window. Unbounded, prevalence degrades into noise: a real run
          // over 17,263 sessions reported "16/17263" — a true count with a
          // denominator so large the ratio stopped meaning anything, and 386
          // proposals no human would review.
          maxSessions: Number.parseInt(opts.maxSessions, 10) || 400,
        });
        scanned += result.scanned;
        included += result.included;
        excluded += result.excluded_permission;
        truncated += result.truncated;
        digests.push(...result.digests);
        sourceSummaries.push({
          name,
          label: corpusScanLabel(result.scanned, result.included),
          scanned: result.scanned,
          included: result.included,
          malformed: result.malformed,
          // Truncation is a bounded read, NOT corruption — reported separately so an
          // oversized transcript can never masquerade as malformed JSONL.
          truncated: result.truncated,
        });
      }
      try {
        const { proposals, withheldSecrets, dropped, suppressedRejected, patterns } =
          await runDreamFromDigests(store, digests, {
            scanned,
            included,
            excluded_permission: excluded,
          });
        console.log(
          JSON.stringify(
            {
              proposals: proposals.length,
              patterns,
              withheldSecrets,
              dropped,
              suppressedRejected,
              truncated,
              scanned,
              included,
              excluded_permission: excluded,
              sources: sourceSummaries,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        console.error((err as Error).message);
        process.exitCode = 1;
      }
    });

  program
    .command("review")
    .argument("<action>", "list|show|accept|reject")
    .argument("[id]")
    .option("--yes", "confirm accept")
    .option("--yes-delete", "confirm delete action")
    .option("--reason <text>", "reject reason", "rejected")
    .action(async (action, id, opts) => {
      const global = program.opts();
      const store = await openStore(global.store);
      if (action === "list") {
        console.log(JSON.stringify(await listProposals(store), null, 2));
        return;
      }
      if (!id) throw new Error("id required");
      if (action === "show") {
        const { assertProposalId } = await import("./review.js");
        assertProposalId(id);
        const buf = await store.read(`proposals/${id}.json`);
        if (!buf) throw new Error(`proposal not found: ${id}`);
        console.log(buf.toString("utf8"));
        return;
      }
      if (action === "reject") {
        await rejectProposal(store, id, opts.reason);
        console.log(`rejected ${id}`);
        return;
      }
      if (action === "accept") {
        if (!opts.yes) throw new Error("accept requires --yes on a named id");
        await acceptProposal(store, id, { yesDelete: !!opts.yesDelete });
        console.log(`accepted ${id}`);
        return;
      }
      throw new Error(`unknown action ${action}`);
    });

  program.command("doctor").action(async () => {
    const global = program.opts();
    const store = await openStore(global.store);
    const before = await store.memoryTreeHash();
    const report = await runDoctor(store);
    const after = await store.memoryTreeHash();
    if (before !== after) throw new Error("doctor mutated store");
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  });

  program
    .command("export")
    .requiredOption("--out <path>", "absolute archive path")
    .action(async (opts) => {
      const global = program.opts();
      const store = await openStore(global.store);
      await exportStore(store, opts.out);
      console.log(`exported to ${opts.out}`);
    });

  program
    .command("import")
    .requiredOption("--from <path>", "absolute archive path")
    .option("--merge", "merge into store")
    .option("--replace", "replace via CAS on existing paths")
    .action(async (opts) => {
      const global = program.opts();
      const store = await openStore(global.store);
      const mode = opts.replace ? "replace" : opts.merge ? "merge" : null;
      if (!mode) throw new Error("pass --merge or --replace");
      const r = await importStore(store, opts.from, mode);
      console.log(JSON.stringify(r, null, 2));
      // Rows can be rejected while others import; exiting 0 there reported a
      // partial or total loss as success. Any not-ok import fails the command.
      if (!r.ok) {
        console.error(
          `import NOT ok: ${r.rejected} rejected — ${JSON.stringify(r.reasons)}; see receipts/`,
        );
        process.exitCode = 1;
      }
    });

  program
    .command("efficacy")
    .description(
      "Score accepted pattern-notes against sessions AFTER acceptance: RESOLVED / PERSISTING / INSUFFICIENT_DATA",
    )
    .option("--source <name>", "claude|codex|cursor|agy|opencode|all", "all")
    .option("--scope <tier>", "user|project")
    .option("--max-sessions <n>", "post-acceptance window per source", "400")
    .option(
      "--propose-expiry",
      "RESOLVED x2 with an adequate window: emit an expire PROPOSAL (a human still reviews)",
    )
    .action(async (opts) => {
      const global = program.opts();
      const store = await openStore(global.store ?? opts.scope);
      const scope = (opts.scope ?? global.store ?? "user") as "user" | "project";
      const sources = {
        claude: claudeCorpus,
        codex: codexCorpus,
        cursor: cursorCorpus,
        agy: agyCorpus,
        opencode: opencodeCorpus,
      } as const;
      const selected =
        opts.source === "all"
          ? (Object.keys(sources) as CorpusSourceName[])
          : ([opts.source] as CorpusSourceName[]).filter((k) => k in sources);
      const digests = [];
      for (const name of selected) {
        const r = await digestRoots({
          roots: defaultCorpusRoots(name),
          source: name,
          projectKey: scope === "project" ? path.basename(process.cwd()) : undefined,
          maxSessions: Number.parseInt(opts.maxSessions, 10) || 400,
        });
        digests.push(...r.digests);
      }
      const results = await measureEfficacy(store, digests, {
        proposeExpiry: !!opts.proposeExpiry,
      });
      console.log(JSON.stringify({ notes: results.length, results }, null, 2));
      // PERSISTING notes are actionable (escalate, don't re-remember); UNPARSEABLE
      // notes are damaged. Either makes the command exit non-zero so automation
      // can gate on it — the same contract as import's ok flag.
      if (results.some((r) => r.verdict === "PERSISTING" || r.verdict === "UNPARSEABLE_NOTE")) {
        process.exitCode = 1;
      }
    });

  program
    .command("usage")
    .description(
      "Skill-usage telemetry derived from digests (REPORT-ONLY; never edits or archives a skill)",
    )
    .option("--source <name>", "claude|codex|cursor|agy|opencode|all", "all")
    .option("--skills-dir <path>", "registry of <name>/SKILL.md folders (the denominator)")
    .option("--max-sessions <n>", "window per source", "400")
    .action(async (opts) => {
      const sources = {
        claude: claudeCorpus,
        codex: codexCorpus,
        cursor: cursorCorpus,
        agy: agyCorpus,
        opencode: opencodeCorpus,
      } as const;
      const selected =
        opts.source === "all"
          ? (Object.keys(sources) as CorpusSourceName[])
          : ([opts.source] as CorpusSourceName[]).filter((k) => k in sources);
      const digests = [];
      for (const name of selected) {
        const r = await digestRoots({
          roots: defaultCorpusRoots(name),
          source: name,
          maxSessions: Number.parseInt(opts.maxSessions, 10) || 400,
        });
        digests.push(...r.digests);
      }
      const report = measureUsage(digests, opts.skillsDir);
      console.log(JSON.stringify(report, null, 2));
    });

  program.command("mcp").action(async () => {
    const global = program.opts();
    const store = await openStore(global.store);
    await runMcpServer(store.root);
  });

  return program;
}

async function main() {
  await buildCli().parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
