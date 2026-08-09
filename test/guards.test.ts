import fs from "node:fs";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { exportStore } from "../src/portability.js";
import { MemoryStore } from "../src/store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

const FORBIDDEN = new Set([
  "writeFile",
  "writeFileSync",
  "rename",
  "renameSync",
  "unlink",
  "unlinkSync",
  "rm",
  "rmSync",
  "createWriteStream",
]);

/** Modules allowed to call fs mutation APIs (store-root or audited external). */
const ALLOWED = new Set(["store.ts", "installer.ts", "portability.ts"]);

function collectWriteCalls(filePath: string): string[] {
  const text = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.ES2022, true);
  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      let name = "";
      if (ts.isPropertyAccessExpression(expr)) name = expr.name.text;
      else if (ts.isIdentifier(expr)) name = expr.text;
      if (FORBIDDEN.has(name)) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        hits.push(`${path.basename(filePath)}:${line + 1}:${name}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

describe("repo guards", () => {
  it("package.json has no omega/telegram/pipecat deps", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
    ];
    for (const n of names) {
      expect(n).not.toMatch(/omega|telegram|pipecat/i);
    }
  });

  it("AST: only store/installer/portability may call fs mutation APIs", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(abs);
        else if (ent.name.endsWith(".ts")) {
          if (ALLOWED.has(path.basename(abs))) continue;
          offenders.push(...collectWriteCalls(abs));
        }
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });

  it("positive control: fixture source with writeFile is flagged", () => {
    const fake = `
      import fs from "node:fs/promises";
      await fs.writeFile("x", "y");
    `;
    const sf = ts.createSourceFile("fake.ts", fake, ts.ScriptTarget.ES2022, true);
    let hit = false;
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "writeFile"
      ) {
        hit = true;
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    expect(hit).toBe(true);
  });

  it("accept/reject refuse traversal-shaped proposal ids", async () => {
    const { acceptProposal, rejectProposal } = await import("../src/review.js");
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-rev-"));
    const store = await MemoryStore.initStore(root);
    await expect(acceptProposal(store, "../escape")).rejects.toThrow(/invalid proposal id/);
    await expect(rejectProposal(store, "a/b", "x")).rejects.toThrow(/invalid proposal id/);
  });

  it("portability refuses archive inside store root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-exp-"));
    const store = await MemoryStore.initStore(root);
    await expect(exportStore(store, path.join(root, "out.gcm.gz"))).rejects.toThrow(
      /must not target the store root/,
    );
  });

  it("installer refuses fragment path under store root", async () => {
    const { installFragments } = await import("../src/installer.js");
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-inst-"));
    await MemoryStore.initStore(root);
    await expect(
      installFragments({
        dryRun: true,
        home: root,
        cwd: root,
        storeHint: root,
        storeRoot: root,
      }),
    ).rejects.toThrow(/refuses store-root target/);
  });
});
