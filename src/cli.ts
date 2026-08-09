import { Command } from "commander";
import os from "node:os";
import path from "node:path";
import { agyCorpus } from "./corpus/agy.js";
import { claudeCorpus } from "./corpus/claude.js";
import { codexCorpus } from "./corpus/codex.js";
import { cursorCorpus } from "./corpus/cursor.js";
import { opencodeCorpus } from "./corpus/opencode.js";
import { runDoctor } from "./doctor.js";
import { runDream } from "./dream/run.js";
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
      throw new Error(
        "Project store missing. Run: gotcontext-memory init --project",
      );
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
    .description(
      "Disk-canonical markdown memory + HITL dreaming for multiple coding agents",
    )
    .option("--store <tier>", "user|project");

  program
    .command("init")
    .option("--project", "initialize .gotcontext in cwd")
    .option("--dry-run", "print plan only")
    .option("--force", "overwrite tampered managed blocks")
    .option("--mcp", "note MCP enablement (use `mcp` command to serve)")
    .action(async (opts) => {
      const root = opts.project
        ? projectStoreRoot(process.cwd())
        : userStoreRoot();
      if (opts.dryRun) {
        console.log(`Would init store at ${root}`);
        const { planned } = await installFragments({
          dryRun: true,
          storeHint: root,
          storeRoot: root,
          force: !!opts.force,
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
        force: !!opts.force,
      });
      await store.commitOperational({
        relativePath: "installer-manifest.json",
        body: JSON.stringify({ entries: manifest }, null, 2) + "\n",
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
      };
      const selected =
        opts.source === "all"
          ? Object.values(sources)
          : [sources[opts.source as keyof typeof sources]].filter(Boolean);
      let scanned = 0;
      let included = 0;
      let excluded = 0;
      const transcripts = [];
      for (const src of selected) {
        const roots =
          src.name === "claude"
            ? [path.join(os.homedir(), ".claude", "projects")]
            : [path.join(store.root, "fixtures", src.name)];
        const result = await src.scan({
          scope,
          roots,
          projectKey:
            scope === "project" ? path.basename(process.cwd()) : undefined,
        });
        scanned += result.scanned;
        included += result.included;
        excluded += result.excluded_permission;
        transcripts.push(...result.transcripts);
      }
      try {
        const { proposals, withheldSecrets, dropped } = await runDream(
          store,
          transcripts,
          {
            scanned,
            included,
            excluded_permission: excluded,
          },
        );
        console.log(
          JSON.stringify(
            {
              proposals: proposals.length,
              withheldSecrets,
              dropped,
              scanned,
              included,
              excluded_permission: excluded,
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
