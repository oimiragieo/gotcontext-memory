#!/usr/bin/env bash
# End-to-end dogfood of gotcontext-memory inside the Claude CLI container.
# Exit non-zero on any failed assertion. Prints a machine-readable ISSUES block.
set -euo pipefail

PKG_ROOT="${GCM_PKG_ROOT:-/home/dogfood/gotcontext-memory}"
WORK="${GCM_WORK:-/home/dogfood/workspace}"
REPORT="${GCM_REPORT:-/home/dogfood/workspace/VERIFY_REPORT.md}"
ISSUES=()
PASS=0
FAIL=0

log() { printf '%s\n' "$*"; }
pass() { PASS=$((PASS + 1)); log "PASS: $*"; }
fail() {
  FAIL=$((FAIL + 1))
  ISSUES+=("$*")
  log "FAIL: $*"
}
assert_eq() {
  local label="$1" got="$2" want="$3"
  if [[ "$got" == "$want" ]]; then pass "$label"; else fail "$label (got='$got' want='$want')"; fi
}
assert_file() {
  local f="$1"
  if [[ -f "$f" ]]; then pass "file exists: $f"; else fail "missing file: $f"; fi
}
assert_contains() {
  local label="$1" hay="$2" needle="$3"
  if grep -Fq -- "$needle" <<<"$hay"; then pass "$label"; else fail "$label (missing '$needle')"; fi
}

mkdir -p "$WORK" "$HOME/.claude/projects" "$HOME/.codex"
cd "$WORK"
: >"$REPORT"

{
  echo "# gotcontext-memory Docker verification"
  echo
  echo "- date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- node: $(node -v)"
  echo "- claude: $(claude --version 2>&1 | head -1 || echo 'MISSING')"
  echo "- package: $PKG_ROOT"
  echo
} >>"$REPORT"

log "=== 0. Preflight Claude CLI + toolkit binaries ==="
if command -v claude >/dev/null 2>&1; then
  CLVER=$(claude --version 2>&1 | head -1 || true)
  pass "claude on PATH ($CLVER)"
else
  fail "claude binary missing from PATH"
fi

if command -v gotcontext-memory >/dev/null 2>&1; then
  pass "gotcontext-memory on PATH"
else
  # rebuild/link if bind-mounted sources
  (cd "$PKG_ROOT" && npm ci && npm run build && npm link)
  if command -v gotcontext-memory >/dev/null 2>&1; then
    pass "gotcontext-memory linked after rebuild"
  else
    fail "gotcontext-memory binary missing"
  fi
fi

HELP=$(gotcontext-memory --help 2>&1 || true)
assert_contains "CLI help lists init" "$HELP" "init"
assert_contains "CLI help lists dream" "$HELP" "dream"
assert_contains "CLI help lists doctor" "$HELP" "doctor"

log "=== 1. Fresh HOME: init user store + adapters ==="
# Isolate store HOME under WORK so re-runs are clean
export HOME="$WORK/home"
# Hermetic: wipe prior volume leftovers (stores + adapter stamps).
rm -rf "$HOME" "$WORK/project" "$WORK/AGENTS.md" "$WORK/.cursor" "$WORK/export.gcm.gz" 2>/dev/null || true
mkdir -p "$HOME/.claude/projects" "$HOME/.codex" "$WORK/project"

INIT_OUT=$(gotcontext-memory init 2>&1)
assert_contains "init prints store path" "$INIT_OUT" "Initialized store at"
assert_file "$HOME/.gotcontext/MEMORY.md"
assert_file "$HOME/.gotcontext/config.json"
assert_file "$HOME/.gotcontext/installer-manifest.json"
assert_file "$HOME/.claude/CLAUDE.md"
assert_contains "claude adapter marker begin" "$(cat "$HOME/.claude/CLAUDE.md")" "gotcontext-memory:begin"
assert_contains "claude adapter marker end" "$(cat "$HOME/.claude/CLAUDE.md")" "gotcontext-memory:end"
assert_file "$HOME/.codex/AGENTS.md"
assert_file "$WORK/AGENTS.md"
assert_file "$WORK/.cursor/rules/gotcontext-memory.mdc"

DOC_OUT=$(gotcontext-memory doctor 2>&1) || true
assert_contains "doctor ok true" "$DOC_OUT" '"ok": true'
assert_contains "doctor secret scanner pass" "$DOC_OUT" '"name": "secret_scanner"'

log "=== 2. Seed Claude transcripts + dream/review accept ==="
# Layout: ~/.claude/projects/<projectKey>/*.jsonl
SEED="$HOME/.claude/projects/dogfood-proj"
mkdir -p "$SEED"
cp "$PKG_ROOT/test/fixtures/transcripts/claude/proj-a/s1.jsonl" "$SEED/s1.jsonl"
cp "$PKG_ROOT/test/fixtures/transcripts/claude/proj-a/s2.jsonl" "$SEED/s2.jsonl"

DREAM_OUT=$(gotcontext-memory dream --source claude --store user 2>&1) || true
if grep -Fq 'EMPTY_CORPUS' <<<"$DREAM_OUT"; then
  fail "dream EMPTY_CORPUS with seeded Claude fixtures: $DREAM_OUT"
elif grep -Eq '"proposals": [1-9]' <<<"$DREAM_OUT"; then
  pass "dream produced proposals"
else
  fail "dream did not report proposals: $DREAM_OUT"
fi

LIST_OUT=$(gotcontext-memory --store user review list 2>&1) || true
PID=$(printf '%s' "$LIST_OUT" | node -e '
  let s=""; process.stdin.on("data",d=>s+=d); process.stdin.on("end",()=>{
    try {
      const j=JSON.parse(s);
      const arr=Array.isArray(j)?j:(j.proposals||[]);
      if(!arr.length){ process.exit(2); }
      const first=arr[0];
      process.stdout.write(typeof first==="string"?first:(first.id||""));
    } catch { process.exit(3); }
  });
') || PID=""

if [[ -n "${PID:-}" ]]; then
  pass "review list returned proposal id=$PID"
  SHOW_OUT=$(gotcontext-memory --store user review show "$PID" 2>&1) || true
  assert_contains "review show has targetPath" "$SHOW_OUT" "targetPath"
  ACCEPT_OUT=$(gotcontext-memory --store user review accept "$PID" --yes 2>&1) || true
  assert_contains "accept succeeded" "$ACCEPT_OUT" "accepted $PID"
  DOC2=$(gotcontext-memory --store user doctor 2>&1) || true
  assert_contains "doctor still ok after accept" "$DOC2" '"ok": true'
  # MEMORY.md should mention a memory/ path after accept of create/update
  if grep -Eq 'memory/' "$HOME/.gotcontext/MEMORY.md"; then
    pass "MEMORY.md lists memory after accept"
  else
    # expire/delete may not; still check store mutated somehow
    if find "$HOME/.gotcontext/memory" -name '*.md' 2>/dev/null | grep -q .; then
      pass "memory/*.md present after accept"
    else
      fail "accept left no memory files / index links"
    fi
  fi
else
  fail "could not parse proposal id from review list: $LIST_OUT"
fi

log "=== 3. Project store ambiguity + doctor ==="
cd "$WORK/project"
git init -q 2>/dev/null || true
set +e
PROJ_INIT=$(gotcontext-memory init --project 2>&1)
PROJ_RC=$?
set -e
if [[ "$PROJ_RC" -eq 0 ]]; then
  assert_contains "project init" "$PROJ_INIT" "Initialized store at"
else
  fail "project init failed (rc=$PROJ_RC): $PROJ_INIT"
fi
assert_file "$WORK/project/.gotcontext/MEMORY.md"
# Home Claude fragment must still point at user store (DV-002)
if grep -Fq "$HOME/.gotcontext" "$HOME/.claude/CLAUDE.md"; then
  pass "home CLAUDE.md still points at user store after project init"
else
  fail "home CLAUDE.md lost user store hint after project init"
fi

# With both stores, bare doctor should refuse
set +e
AMB=$(gotcontext-memory doctor 2>&1)
AMB_RC=$?
set -e
assert_contains "ambiguous store refused" "$AMB" "Ambiguous store"
if [[ "$AMB_RC" -ne 0 ]]; then pass "ambiguous doctor non-zero exit"; else fail "ambiguous doctor exited 0"; fi

set +e
PROJ_DOC=$(gotcontext-memory --store project doctor 2>&1)
set -e
assert_contains "project doctor ok" "$PROJ_DOC" '"ok": true'

log "=== 4. Export / import merge ==="
EXPORT_PATH="$WORK/export.gcm.gz"
set +e
EXP_OUT=$(gotcontext-memory --store user export --out "$EXPORT_PATH" 2>&1)
set -e
assert_file "$EXPORT_PATH"
assert_contains "export message" "$EXP_OUT" "exported to"

set +e
IMP_OUT=$(gotcontext-memory --store project import --from "$EXPORT_PATH" --merge 2>&1)
set -e
assert_contains "import merge ok" "$IMP_OUT" '"imported"'

log "=== 5. MCP thin JSON-RPC smoke ==="
set +e
MCP_OUT=$(printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | timeout 5 gotcontext-memory --store user mcp 2>&1)
MCP_RC=$?
set -e
if grep -Fq 'tools' <<<"$MCP_OUT" || grep -Fq 'memory_' <<<"$MCP_OUT" || grep -Fq 'result' <<<"$MCP_OUT"; then
  pass "MCP server responded to JSON-RPC"
else
  fail "MCP smoke produced no usable response (rc=$MCP_RC): $MCP_OUT"
fi

log "=== 6. Uninstall restores / strips adapters ==="
cd "$WORK"
set +e
UN_OUT=$(gotcontext-memory --store user uninstall 2>&1)
set -e
assert_contains "uninstall restored" "$UN_OUT" "restored"
if grep -Fq 'gotcontext-memory:begin' "$HOME/.claude/CLAUDE.md" 2>/dev/null; then
  fail "uninstall left managed markers in ~/.claude/CLAUDE.md"
else
  pass "claude CLAUDE.md managed block removed or file restored"
fi

log "=== 7. Unit/integration suite inside image ==="
cd "$PKG_ROOT"
set +e
TEST_OUT=$(npm test 2>&1)
TEST_RC=$?
set -e
if [[ "$TEST_RC" -eq 0 ]]; then
  pass "npm test exit 0"
else
  fail "npm test failed (rc=$TEST_RC)"
fi
# Capture last lines into report
{
  echo "## npm test"
  echo '```'
  printf '%s\n' "$TEST_OUT" | tail -40
  echo '```'
  echo
} >>"$REPORT"

log "=== 8. Lint ==="
set +e
LINT_OUT=$(npm run lint 2>&1)
LINT_RC=$?
set -e
if [[ "$LINT_RC" -eq 0 ]]; then
  pass "npm run lint exit 0"
else
  fail "npm run lint failed (rc=$LINT_RC): $(printf '%s' "$LINT_OUT" | tail -20)"
fi

# Write summary
{
  echo "## Summary"
  echo
  echo "- PASS: $PASS"
  echo "- FAIL: $FAIL"
  echo
  if [[ "$FAIL" -eq 0 ]]; then
    echo "**VERDICT: PASS** — toolkit verified in Claude CLI Docker environment."
  else
    echo "**VERDICT: FAIL** — issues found:"
    echo
    for i in "${ISSUES[@]}"; do
      echo "- $i"
    done
  fi
  echo
  echo "## Claude CLI"
  echo
  echo '```'
  claude --version 2>&1 || true
  echo '```'
} >>"$REPORT"

log ""
log "REPORT: $REPORT"
log "PASS=$PASS FAIL=$FAIL"
if [[ "$FAIL" -ne 0 ]]; then
  log "ISSUES:"
  for i in "${ISSUES[@]}"; do log " - $i"; done
  exit 1
fi
log "VERDICT: PASS"
exit 0
