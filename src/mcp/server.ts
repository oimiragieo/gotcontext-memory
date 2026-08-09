/**
 * Minimal stdio MCP-like JSON-RPC loop for memory tools.
 * Not a full SDK dependency — additive MCP; writes route through MemoryStore.
 */
import { createInterface } from "node:readline";
import { MemoryStore } from "../store.js";
import { handleToolCall } from "./handlers.js";

type Req = {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
};

export async function runMcpServer(storeRoot: string): Promise<void> {
  const store = new MemoryStore(storeRoot);
  await store.reloadConfig();
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const reply = (id: number | string | null, result?: unknown, error?: unknown) => {
    const msg = error ? { jsonrpc: "2.0", id, error } : { jsonrpc: "2.0", id, result };
    process.stdout.write(`${JSON.stringify(msg)}\n`);
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    let req: Req;
    try {
      req = JSON.parse(line) as Req;
    } catch {
      continue;
    }
    try {
      if (req.method === "initialize") {
        reply(req.id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "gotcontext-memory", version: "0.9.0" },
          capabilities: { tools: {} },
        });
        continue;
      }
      if (req.method === "tools/list") {
        reply(req.id, {
          tools: [
            {
              name: "memory_read",
              description: "Read a memory file",
              inputSchema: {
                type: "object",
                properties: { path: { type: "string" } },
                required: ["path"],
              },
            },
            {
              name: "memory_commit",
              description: "CAS commit via MemoryStore.commitCanonical",
              inputSchema: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  body: { type: "string" },
                  baseHash: { type: "string" },
                },
                required: ["path", "body", "baseHash"],
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
          ],
        });
        continue;
      }
      if (req.method === "tools/call") {
        const name = String(req.params?.name ?? "");
        const args = (req.params?.arguments ?? {}) as Record<string, string>;
        const out = await handleToolCall(store, name, args);
        if (out.ok) reply(req.id, out.result);
        else reply(req.id, undefined, out.error);
        continue;
      }
      reply(req.id, undefined, { code: -32601, message: "method not found" });
    } catch (err) {
      reply(req.id, undefined, {
        code: -32000,
        message: (err as Error).message,
      });
    }
  }
}
