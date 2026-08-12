import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { digestTranscriptFile } from "../src/dream/digest.js";

/**
 * Codex rollout JSONL is NOT Claude-shaped: turns arrive as
 *   {timestamp, type:"response_item", payload:{type:"message", role, content:[{type:"input_text"|"output_text", text}]}}
 * The digest parser previously looked only for a top-level `message` key, so all
 * 5,496 codex sessions on the reference machine digested as EMPTY SHELLS —
 * scanned and "included" while contributing zero signal. Included-but-hollow is
 * the false-clean class; these tests pin the codex shape.
 */
async function codexFixture(lines: string[]): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "gcm-codex-"));
  const file = path.join(dir, "2026", "08", "12", "rollout-x.jsonl");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${lines.join("\n")}\n`, "utf8");
  return file;
}

function codexMsg(role: string, text: string, ts = "2026-08-12T20:39:11.351Z"): string {
  return JSON.stringify({
    timestamp: ts,
    type: "response_item",
    payload: {
      type: "message",
      id: "msg_x",
      role,
      content: [{ type: role === "assistant" ? "output_text" : "input_text", text }],
    },
  });
}

describe("codex rollout shape on the digest path", () => {
  it("user/assistant turns are counted, not dropped", async () => {
    const file = await codexFixture([
      JSON.stringify({ timestamp: "2026-08-12T20:39:09.063Z", type: "session_meta", payload: {} }),
      codexMsg("user", "please fix the failing test"),
      codexMsg("assistant", "done, the test now passes"),
    ]);
    const d = await digestTranscriptFile(file, { source: "codex" });
    expect(d.nUser).toBe(1);
    expect(d.nAssistant).toBe(1);
    expect(new Date(d.sessionTs).getUTCFullYear()).toBe(2026);
  });

  it("preferences and corrections are extracted from codex user turns", async () => {
    const file = await codexFixture([
      codexMsg("user", "Please remember: run the linter before every commit."),
      codexMsg("user", "no, that is wrong — use the other flag"),
    ]);
    const d = await digestTranscriptFile(file, { source: "codex" });
    expect(d.nPreferences).toBe(1);
    expect(d.preferences[0]?.span).toMatch(/linter before every commit/i);
    expect(d.nUserCorrections).toBe(1);
  });

  it("developer/system roles are ignored (instructions are not user signal)", async () => {
    const file = await codexFixture([
      codexMsg("developer", "Please remember: this is injected instruction text, not the user."),
    ]);
    const d = await digestTranscriptFile(file, { source: "codex" });
    expect(d.nUser).toBe(0);
    expect(d.nPreferences).toBe(0);
  });

  it("claude-shaped files still parse identically (no regression)", async () => {
    const file = await codexFixture([
      JSON.stringify({
        timestamp: "2026-01-01T00:00:00Z",
        message: { role: "user", content: "Please remember: always run tests." },
      }),
    ]);
    const d = await digestTranscriptFile(file, { source: "claude" });
    expect(d.nUser).toBe(1);
    expect(d.nPreferences).toBe(1);
  });
});
