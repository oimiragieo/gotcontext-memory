#!/usr/bin/env bash
# Multi-harness dogfood for gotcontext-memory.
# Env: GCM_HARNESS=claude|codex|cursor|agy|opencode
set -euo pipefail

HARNESS="${GCM_HARNESS:-claude}"
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
assert_contains() {
  local label="$1" hay="$2" needle="$3"
  if grep -Fq -- "$needle" <<<"$hay"; then pass "$label"; else fail "$label (missing '$needle')"; fi
}
assert_file() {
  local f="$1"
  if [[ -f "$f" ]]; then pass "file exists: $f"; else fail "missing file: $f"; fi
}

harness_bin() {
  case "$HARNESS" in
    claude) echo claude ;;
    codex) echo codex ;;
    cursor) echo cursor ;;
    agy) echo agy ;;
    opencode) echo opencode ;;
    *) echo "" ;;
  esac
}

adapter_path_for_harness() {
  # Echo expected adapter fragment path after user init (HOME + WORK=cwd).
  case "$HARNESS" in
    claude) echo "$HOME/.claude/CLAUDE.md" ;;
    codex) echo "$HOME/.codex/AGENTS.md" ;;
    cursor) echo "$WORK/.cursor/rules/gotcontext-memory.mdc" ;;
    agy|opencode) echo "$WORK/AGENTS.md" ;;
  esac
}

seed_corpus() {
  case "$HARNESS" in
    claude)
      mkdir -p "$HOME/.claude/projects/dogfood-proj"
      cp "$PKG_ROOT/test/fixtures/transcripts/claude/proj-a/s1.jsonl" "$HOME/.claude/projects/dogfood-proj/s1.jsonl"
      cp "$PKG_ROOT/test/fixtures/transcripts/claude/proj-a/s2.jsonl" "$HOME/.claude/projects/dogfood-proj/s2.jsonl"
      ;;
    codex)
      mkdir -p "$HOME/.codex/sessions/dogfood-proj"
      cp "$PKG_ROOT/test/fixtures/transcripts/codex/proj-a/"*.jsonl "$HOME/.codex/sessions/dogfood-proj/"
      ;;
    cursor)
      mkdir -p "$HOME/.cursor/projects/proj-a"
      cp -a "$PKG_ROOT/test/fixtures/transcripts/cursor/proj-a/." "$HOME/.cursor/projects/proj-a/"
      ;;
    agy)
      mkdir -p "$HOME/.agy/sessions/dogfood"
      echo "agy-placeholder" >"$HOME/.agy/sessions/dogfood/note.txt"
      ;;
    opencode)
      mkdir -p "$HOME/.opencode/sessions/dogfood"
      echo "opencode-placeholder" >"$HOME/.opencode/sessions/dogfood/note.txt"
      ;;
  esac
}

mkdir -p "$WORK"
cd "$WORK"
: >"$REPORT"

{
  echo "# gotcontext-memory Docker verification — harness=$HARNESS"
  echo
  echo "- date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- node: $(node -v)"
  echo "- harness: $HARNESS"
  echo "- stub: ${GCM_HARNESS_STUB:-0}"
  echo
} >>"$REPORT"

BIN="$(harness_bin)"
log "=== 0. Preflight harness=$HARNESS toolkit ==="
if [[ -n "$BIN" ]] && command -v "$BIN" >/dev/null 2>&1; then
  pass "$BIN on PATH ($(command -v "$BIN"))"
  set +e
  "$BIN" --version >/tmp/harness-ver.txt 2>&1 || "$BIN" version >/tmp/harness-ver.txt 2>&1 || "$BIN" -v >/tmp/harness-ver.txt 2>&1
  set -e
  pass "harness version probe: $(head -1 /tmp/harness-ver.txt | tr -d '\r')"
else
  fail "harness binary missing: $BIN"
fi

if command -v gotcontext-memory >/dev/null 2>&1; then
  pass "gotcontext-memory on PATH"
else
  fail "gotcontext-memory missing"
fi

log "=== 1. Init user store + adapter fragment ==="
export HOME="$WORK/home"
rm -rf "$HOME" "$WORK/project" "$WORK/AGENTS.md" "$WORK/.cursor" "$WORK/export.gcm.gz" 2>/dev/null || true
mkdir -p "$HOME/.claude/projects" "$HOME/.codex" "$HOME/.cursor" "$HOME/.agy" "$HOME/.opencode" "$WORK/project"

INIT_OUT=$(gotcontext-memory init 2>&1)
assert_contains "init ok" "$INIT_OUT" "Initialized store at"
assert_file "$HOME/.gotcontext/MEMORY.md"
assert_file "$HOME/.gotcontext/installer-manifest.json"

ADAPTER="$(adapter_path_for_harness)"
assert_file "$ADAPTER"
assert_contains "adapter has begin marker" "$(cat "$ADAPTER")" "gotcontext-memory:begin"
assert_contains "adapter has end marker" "$(cat "$ADAPTER")" "gotcontext-memory:end"
assert_contains "adapter store hint" "$(cat "$ADAPTER")" "$HOME/.gotcontext"

DOC_OUT=$(gotcontext-memory doctor 2>&1) || true
assert_contains "doctor ok" "$DOC_OUT" '"ok": true'

log "=== 2. Seed corpus + dream ($HARNESS) ==="
seed_corpus
set +e
DREAM_OUT=$(gotcontext-memory dream --source "$HARNESS" --store user 2>&1)
DREAM_RC=$?
set -e

case "$HARNESS" in
  claude|codex|cursor)
    if grep -Fq 'EMPTY_CORPUS' <<<"$DREAM_OUT"; then
      fail "dream EMPTY_CORPUS for full importer: $DREAM_OUT"
    elif grep -Eq '"proposals": [1-9]' <<<"$DREAM_OUT"; then
      pass "dream produced proposals"
    else
      fail "dream unexpected: rc=$DREAM_RC out=$DREAM_OUT"
    fi
    LIST_OUT=$(gotcontext-memory --store user review list 2>&1) || true
    PID=$(printf '%s' "$LIST_OUT" | node -e '
      let s=""; process.stdin.on("data",d=>s+=d); process.stdin.on("end",()=>{
        try {
          const j=JSON.parse(s);
          const arr=Array.isArray(j)?j:[];
          if(!arr.length) process.exit(2);
          process.stdout.write(arr[0].id||"");
        } catch { process.exit(3); }
      });
    ') || PID=""
    if [[ -n "${PID:-}" ]]; then
      pass "review list id=$PID"
      ACCEPT_OUT=$(gotcontext-memory --store user review accept "$PID" --yes 2>&1) || true
      assert_contains "accept" "$ACCEPT_OUT" "accepted $PID"
    else
      fail "no proposal id from review list: $LIST_OUT"
    fi
    ;;
  agy|opencode)
    # PARTIAL importers: enumerate files, zero transcripts → EMPTY_CORPUS is honest.
    if grep -Fq 'EMPTY_CORPUS' <<<"$DREAM_OUT" && grep -Eq 'scanned=[1-9]' <<<"$DREAM_OUT"; then
      pass "PARTIAL dream honestly EMPTY_CORPUS with scanned>0"
    elif grep -Fq 'EMPTY_CORPUS' <<<"$DREAM_OUT"; then
      fail "PARTIAL EMPTY_CORPUS but scanned=0 (seed missing?): $DREAM_OUT"
    else
      fail "PARTIAL expected EMPTY_CORPUS, got rc=$DREAM_RC: $DREAM_OUT"
    fi
    ;;
esac

log "=== 3. Project init skips home retarget (DV-002) ==="
cd "$WORK/project"
set +e
PROJ_INIT=$(gotcontext-memory init --project 2>&1)
PROJ_RC=$?
set -e
if [[ "$PROJ_RC" -eq 0 ]]; then
  pass "project init ok"
else
  fail "project init failed: $PROJ_INIT"
fi
# Home adapters for claude/codex must keep user store hint
if [[ "$HARNESS" == "claude" ]]; then
  if grep -Fq "$HOME/.gotcontext" "$HOME/.claude/CLAUDE.md"; then
    pass "CLAUDE.md still user-store after project init"
  else
    fail "CLAUDE.md retargeted after project init"
  fi
fi
if [[ "$HARNESS" == "codex" ]]; then
  if grep -Fq "$HOME/.gotcontext" "$HOME/.codex/AGENTS.md"; then
    pass "codex AGENTS.md still user-store after project init"
  else
    fail "codex AGENTS.md retargeted after project init"
  fi
fi

log "=== 4. Export / import + uninstall smoke ==="
cd "$WORK"
EXPORT_PATH="$WORK/export-$HARNESS.gcm.gz"
set +e
EXP_OUT=$(gotcontext-memory --store user export --out "$EXPORT_PATH" 2>&1)
set -e
assert_file "$EXPORT_PATH"
assert_contains "export" "$EXP_OUT" "exported to"

set +e
IMP_OUT=$(gotcontext-memory --store project import --from "$EXPORT_PATH" --merge 2>&1)
set -e
assert_contains "import" "$IMP_OUT" '"imported"'

set +e
UN_OUT=$(gotcontext-memory --store user uninstall 2>&1)
set -e
assert_contains "uninstall" "$UN_OUT" "restored"
if [[ -f "$ADAPTER" ]] && grep -Fq 'gotcontext-memory:begin' "$ADAPTER"; then
  fail "uninstall left markers in $ADAPTER"
else
  pass "adapter markers cleared ($ADAPTER)"
fi

log "=== 5. Suite + lint (once per image; run on all) ==="
cd "$PKG_ROOT"
set +e
TEST_OUT=$(npm test 2>&1)
TEST_RC=$?
LINT_OUT=$(npm run lint 2>&1)
LINT_RC=$?
set -e
if [[ "$TEST_RC" -eq 0 ]]; then pass "npm test"; else fail "npm test rc=$TEST_RC"; fi
if [[ "$LINT_RC" -eq 0 ]]; then pass "npm lint"; else fail "npm lint rc=$LINT_RC"; fi

{
  echo "## Summary"
  echo
  echo "- PASS: $PASS"
  echo "- FAIL: $FAIL"
  echo
  if [[ "$FAIL" -eq 0 ]]; then
    echo "**VERDICT: PASS** — harness=$HARNESS"
  else
    echo "**VERDICT: FAIL** — harness=$HARNESS"
    echo
    for i in "${ISSUES[@]}"; do echo "- $i"; done
  fi
  echo
  echo "## Harness version"
  echo '```'
  cat /tmp/harness-ver.txt 2>/dev/null || true
  echo '```'
  echo
  echo "## npm test (tail)"
  echo '```'
  printf '%s\n' "$TEST_OUT" | tail -20
  echo '```'
} >>"$REPORT"

log "REPORT: $REPORT"
log "PASS=$PASS FAIL=$FAIL harness=$HARNESS"
if [[ "$FAIL" -ne 0 ]]; then
  for i in "${ISSUES[@]}"; do log " - $i"; done
  exit 1
fi
log "VERDICT: PASS"
exit 0
