export type Adapter = {
  id: string;
  detect: () => Promise<boolean>;
  fragmentPath: (home: string, cwd: string) => string;
  render: (storeHint: string) => string;
};

const MARK_BEGIN = "<!-- gotcontext-memory:begin -->";
const MARK_END = "<!-- gotcontext-memory:end -->";

function fragment(storeHint: string): string {
  return `${MARK_BEGIN}
# Gotcontext memory

- Durable memory lives at \`${storeHint}\` (MEMORY.md index + memory/*.md).
- Search with ordinary filesystem tools (grep/read). Prefer progressive disclosure.
- Do not silently rewrite memory; propose changes via \`gotcontext-memory dream\` / HITL review.
- Writes must go through \`gotcontext-memory\` / MCP commit tools (CAS + secret scan).
${MARK_END}`;
}

export const adapters: Adapter[] = [
  {
    id: "claude-code",
    detect: async () => true,
    fragmentPath: (home) => `${home}/.claude/CLAUDE.md`,
    render: (h) => fragment(h),
  },
  {
    id: "agy",
    detect: async () => true,
    fragmentPath: (_h, cwd) => `${cwd}/AGENTS.md`,
    render: (h) => fragment(h),
  },
  {
    id: "codex",
    detect: async () => true,
    fragmentPath: (home) => `${home}/.codex/AGENTS.md`,
    render: (h) => fragment(h),
  },
  {
    id: "opencode",
    detect: async () => true,
    fragmentPath: (_h, cwd) => `${cwd}/AGENTS.md`,
    render: (h) => fragment(h),
  },
  {
    id: "cursor",
    detect: async () => true,
    fragmentPath: (_h, cwd) => `${cwd}/.cursor/rules/gotcontext-memory.mdc`,
    render: (h) => fragment(h),
  },
];

export { MARK_BEGIN, MARK_END };
