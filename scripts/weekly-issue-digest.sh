#!/usr/bin/env bash
# Build a weekly GitHub issue digest for AI + human triage.
# Requires: gh (authenticated). jq is optional (gh --jq is enough).
set -euo pipefail

if [[ -n "${GH:-}" ]]; then
  :
elif command -v gh >/dev/null 2>&1; then
  GH=gh
elif [[ -x "/mnt/c/Program Files/GitHub CLI/gh.exe" ]]; then
  GH="/mnt/c/Program Files/GitHub CLI/gh.exe"
else
  echo "gh CLI not found; set GH=/path/to/gh" >&2
  exit 1
fi

REPO="${GITHUB_REPOSITORY:-oimiragieo/gotcontext-memory}"
WEEK_ID="${WEEK_ID:-$(date -u +%G-W%V)}"
TITLE="Weekly triage ${WEEK_ID}"

# Prefer a path both WSL bash and Windows gh.exe can read (avoid /tmp with gh.exe).
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="${root}/.git/weekly-triage-body.md"
mkdir -p "${root}/.git"
trap 'rm -f "$tmp"' EXIT

body_file_for_gh() {
  if [[ "$GH" == *.exe ]] && command -v wslpath >/dev/null 2>&1; then
    wslpath -w "$tmp"
  else
    printf '%s' "$tmp"
  fi
}

# Open issues needing attention (exclude prior weekly digests).
mapfile -t NEEDS < <(
  "$GH" issue list --repo "$REPO" --state open --label needs-triage --limit 100 \
    --json number,title,labels,createdAt,author,url \
    --jq '.[] | "\(.number)\t\(.title)\t\(.url)\t\(.createdAt)\t\(.author.login)"'
)

mapfile -t OPEN_BUGS < <(
  "$GH" issue list --repo "$REPO" --state open --label bug --limit 100 \
    --json number,title,url --jq '.[] | select(.title | startswith("Weekly triage") | not) | "#\(.number) \(.title) — \(.url)"'
)

mapfile -t OPEN_FEATS < <(
  "$GH" issue list --repo "$REPO" --state open --label enhancement --limit 100 \
    --json number,title,url --jq '.[] | select(.title | startswith("Weekly triage") | not) | "#\(.number) \(.title) — \(.url)"'
)

{
  echo "## Weekly triage — ${WEEK_ID}"
  echo
  echo "Generated: $(date -u +%Y-%m-%dT%H:%MZ) by \`.github/workflows/weekly-issue-triage.yml\`."
  echo
  echo "### AI processing instructions"
  echo
  echo "Follow [docs/guides/issue-triage-weekly.md](https://github.com/oimiragieo/gotcontext-memory/blob/main/docs/guides/issue-triage-weekly.md)."
  echo
  echo "1. Classify each \`needs-triage\` item → area/\`*\` + priority/p0|p1|p2."
  echo "2. Deduplicate against open bugs/features and \`docs/BACKLOG.md\`."
  echo "3. Draft a short reply comment per issue (do **not** close without human OK on p0/security)."
  echo "4. Propose BACKLOG IDs for accepted work; note honesty conflicts."
  echo "5. Comment a **Triage summary** on **this** issue when done; remove \`needs-triage\` from processed items."
  echo
  echo "### needs-triage ($(printf '%s\n' "${NEEDS[@]:-}" | grep -c . || true))"
  echo
  if [[ ${#NEEDS[@]} -eq 0 || -z "${NEEDS[0]:-}" ]]; then
    echo "_None open. Digest still posted so the weekly AI loop stays visible._"
  else
    echo "| # | Title | Author | Created | URL |"
    echo "|---|---|---|---|---|"
    for row in "${NEEDS[@]}"; do
      IFS=$'\t' read -r num title url created author <<<"$row"
      # Escape pipes in titles
      title="${title//|/\\|}"
      echo "| #${num} | ${title} | @${author} | ${created} | ${url} |"
    done
  fi
  echo
  echo "### Open bugs ($(printf '%s\n' "${OPEN_BUGS[@]:-}" | grep -c . || true))"
  echo
  if [[ ${#OPEN_BUGS[@]} -eq 0 || -z "${OPEN_BUGS[0]:-}" ]]; then
    echo "_None._"
  else
    printf '%s\n' "${OPEN_BUGS[@]}" | sed 's/^/- /'
  fi
  echo
  echo "### Open feature requests ($(printf '%s\n' "${OPEN_FEATS[@]:-}" | grep -c . || true))"
  echo
  if [[ ${#OPEN_FEATS[@]} -eq 0 || -z "${OPEN_FEATS[0]:-}" ]]; then
    echo "_None._"
  else
    printf '%s\n' "${OPEN_FEATS[@]}" | sed 's/^/- /'
  fi
  echo
  echo "### Labels cheat-sheet"
  echo
  echo "\`area/dream\` \`area/efficacy\` \`area/store\` \`area/mcp\` \`area/corpus\` \`area/docs\` · \`priority/p0\` \`priority/p1\` \`priority/p2\`"
  echo
  echo "<!-- weekly-triage:${WEEK_ID} -->"
} >"$tmp"

existing="$(
  "$GH" issue list --repo "$REPO" --state open --label triage/weekly --limit 20 \
    --json number,title,body \
    --jq ".[] | select(.title == \"${TITLE}\") | .number" | head -1
)"

if [[ -n "${existing}" ]]; then
  "$GH" issue edit "$existing" --repo "$REPO" --body-file "$(body_file_for_gh)"
  echo "Updated existing weekly issue #${existing}"
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "ISSUE_NUMBER=${existing}" >>"$GITHUB_OUTPUT"
  fi
else
  url="$("$GH" issue create --repo "$REPO" --title "$TITLE" --label triage/weekly --body-file "$(body_file_for_gh)")"
  echo "Created ${url}"
  num="${url##*/}"
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "ISSUE_NUMBER=${num}" >>"$GITHUB_OUTPUT"
  fi
fi
