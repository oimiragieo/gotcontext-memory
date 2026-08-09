import { readdir } from "node:fs/promises";
import path from "node:path";
import { BASE_ABSENT, MemoryStore } from "../store.js";

export type McpResult =
  | { ok: true; result: unknown }
  | { ok: false; error: { code: number; message: string } };

export async function handleToolCall(
  store: MemoryStore,
  name: string,
  args: Record<string, string>,
): Promise<McpResult> {
  if (name === "memory_read") {
    const buf = await store.read(args.path);
    return {
      ok: true,
      result: {
        content: [{ type: "text", text: buf ? buf.toString("utf8") : "" }],
      },
    };
  }
  if (name === "memory_search") {
    const out: string[] = [];
    const walk = async (dir: string, prefix: string) => {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        const rel = path.posix.join(prefix, e.name);
        if (e.isDirectory()) await walk(abs, rel);
        else out.push(rel);
      }
    };
    try {
      await walk(path.join(store.root, "memory"), "memory");
    } catch {
      /* */
    }
    return {
      ok: true,
      result: { content: [{ type: "text", text: out.join("\n") }] },
    };
  }
  if (name === "memory_commit") {
    try {
      const r = await store.commitCanonical({
        relativePath: args.path,
        body: args.body,
        baseHash: args.baseHash || BASE_ABSENT,
        provenance: { authored_by: "agent", source: "mcp" },
      });
      return {
        ok: true,
        result: { content: [{ type: "text", text: JSON.stringify(r) }] },
      };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: -32000,
          message: (err as Error).name + ": " + (err as Error).message,
        },
      };
    }
  }
  if (name === "memory_propose") {
    try {
      const id = `mcp-${Date.now()}`;
      await store.commitOperational({
        relativePath: `proposals/${id}.json`,
        body:
          JSON.stringify(
            {
              id,
              action: "create",
              targetPath: args.path,
              base_hash: args.baseHash || BASE_ABSENT,
              body: args.body,
              evidence: [{ transcriptId: "mcp", quote: args.body?.slice(0, 80) }],
              createdAt: new Date().toISOString(),
            },
            null,
            2,
          ) + "\n",
      });
      return {
        ok: true,
        result: { content: [{ type: "text", text: JSON.stringify({ id }) }] },
      };
    } catch (err) {
      return {
        ok: false,
        error: { code: -32000, message: (err as Error).message },
      };
    }
  }
  return {
    ok: false,
    error: { code: -32601, message: `unknown tool: ${name}` },
  };
}
