# Weekly issue triage (AI + human)

**Audience:** maintainers and AI agents processing community bugs / feature requests.  
**Chooser:** https://github.com/oimiragieo/gotcontext-memory/issues/new/choose  
**Automation:** `.github/workflows/weekly-issue-triage.yml` (Mondays 15:00 UTC + manual `workflow_dispatch`)

---

## What GitHub is set up to do

| Piece | Role |
|---|---|
| Issue forms (`bug` / `feature`) | Structured intake; auto-labels `bug`/`enhancement` + `needs-triage` |
| Blank issues | **Disabled** — force a template |
| Discussions | Q&A / design chat (not the bug tracker) |
| Labels | `needs-triage`, `area/*`, `priority/p*`, `triage/weekly` |
| Weekly workflow | Creates/updates issue **Weekly triage YYYY-Www** with open queues |

---

## AI weekly loop (copy this)

1. **Open the latest** issue labeled `triage/weekly` (title starts with `Weekly triage`).
2. **For each `needs-triage` row:**
   - Read the issue body.
   - Map to an `area/*` label.
   - Set `priority/p0` (security/data-loss/blocker), `p1` (this week), or `p2` (backlog).
   - Check duplicates vs other open issues and [`docs/BACKLOG.md`](../BACKLOG.md).
   - Check honesty: is this an intentional non-claim? Point to [`HONESTY.md`](../HONESTY.md).
3. **Draft** a short comment on each source issue:
   - Acknowledge + paraphrase
   - Ask for missing repro fields if any
   - Say next step (accept to BACKLOG, need info, wontfix+why)
4. **Do not** without a human:
   - Close `priority/p0` or security reports
   - Merge code
   - Promise LLM / omega parity
5. **On the weekly issue**, post a **Triage summary** table:

   | Issue | Area | Priority | Disposition | BACKLOG id (if any) |
   |---|---|---|---|---|

6. Remove `needs-triage` from issues you finished classifying (keep `bug`/`enhancement`).

---

## Human CEO gate

- AI proposes; human accepts BACKLOG IDs and closes issues.
- Weekly digest issues stay open until the week’s summary is posted, then may be closed as completed.

---

## Manual run

```bash
# Local (needs gh auth):
WEEK_ID=$(date -u +%G-W%V) ./scripts/weekly-issue-digest.sh

# Or GitHub UI: Actions → weekly-issue-triage → Run workflow
```

---

## Filing tips (share with reporters)

- Bugs: minimal `HOME` sandbox + exact CLI  
- Features: problem first, then shape, then honesty check  
- Questions: [Discussions](https://github.com/oimiragieo/gotcontext-memory/discussions)
