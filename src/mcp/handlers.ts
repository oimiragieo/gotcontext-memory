import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config.js";
import { BASE_ABSENT, type MemoryStore } from "../store.js";

export type McpResult =
  | { ok: true; result: unknown }
  | { ok: false; error: { code: number; message: string } };

function assertMemoryReadPath(rel: string): void {
  const n = rel.replace(/\\/g, "/");
  if (n === "MEMORY.md" || n.startsWith("memory/")) return;
  throw new Error(`memory_read path must be MEMORY.md or memory/**, got ${rel}`);
}

export async function listMcpTools(store: MemoryStore): Promise<
  Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>
> {
  const cfg = await loadConfig(store.root);
  const tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }> = [
    {
      name: "memory_read",
      description: "Read MEMORY.md or a memory/** file",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
    {
      name: "memory_search",
      description: "List memory file paths",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "memory_propose",
      description: "Write a HITL proposal (operational only)",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          body: { type: "string" },
          baseHash: { type: "string" },
        },
        required: ["path", "body"],
      },
    },
  ];
  if (cfg.mcp.allowCommit) {
    tools.splice(1, 0, {
      name: "memory_commit",
      description:
        "CAS commit via MemoryStore.commitCanonical (non-HITL; requires mcp.allowCommit)",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          body: { type: "string" },
          baseHash: { type: "string" },
        },
        required: ["path", "body", "baseHash"],
      },
    });
  }
  return tools;
}

export async function handleToolCall(
  store: MemoryStore,
  name: string,
  args: Record<string, string>,
): Promise<McpResult> {
  if (name === "memory_read") {
    try {
      assertMemoryReadPath(args.path);
      const buf = await store.read(args.path);
      return {
        ok: true,
        result: {
          content: [{ type: "text", text: buf ? buf.toString("utf8") : "" }],
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: { code: -32000, message: (err as Error).message },
      };
    }
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
    const cfg = await loadConfig(store.root);
    if (!cfg.mcp.allowCommit) {
      return {
        ok: false,
        error: {
          code: -32000,
          message:
            "memory_commit disabled (mcp.allowCommit=false); use memory_propose + review accept",
        },
      };
    }
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
          message: `${(err as Error).name}: ${(err as Error).message}`,
        },
      };
    }
  }
  if (name === "memory_propose") {
    try {
      const id = `mcp-${Date.now()}`;
      await store.commitOperational({
        relativePath: `proposals/${id}.json`,
        body: `${JSON.stringify(
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
        )}\n`,
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
