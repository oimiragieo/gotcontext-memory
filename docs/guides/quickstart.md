# Quickstart

**Related:** [START-HERE](../START-HERE.md) · [CLI](../reference/cli.md) · [first walkthrough](./first-dream-walkthrough.md)

---

## Prerequisites

- Node.js **≥ 22.5.0** (`node -v`)
- A sandbox directory (do **not** point experiments at your only production store)

---

## 1. Install the package

```bash
cd /path/to/gotcontext-memory
npm install
npm run build
npm link    # optional; exposes gotcontext-memory on PATH
```

Prefer the binary name `gotcontext-memory`. The `gcm` alias may collide with Git
Credential Manager on Windows.

---

## 2. Init a user store (sandbox home)

```bash
# Optional: isolate HOME so you do not touch your real ~/.gotcontext
export HOME=/tmp/gcm-sandbox-home
mkdir -p "$HOME"

gotcontext-memory init
gotcontext-memory doctor
```

Expect doctor JSON with `secret_scanner: pass`. `memories` may be `EMPTY`.

---

## 3. Project store (optional)

```bash
cd /tmp/my-demo-repo
gotcontext-memory init --project
gotcontext-memory --store project doctor
```

If both user and project stores exist, bare commands without `--store` refuse
as ambiguous.

---

## 4. Dry-run adapters

```bash
gotcontext-memory init --dry-run
# prints adapterId:/path pairs without writing (when used before init writes)
```

---

## 5. Dream + review (fixture path)

Claude dreams read `~/.claude/projects` by default. For a self-contained demo,
use the package test fixtures via a small script, or copy fixtures into
`$HOME/.gotcontext/fixtures/codex` and run `--source codex`.

Minimal path using Node against the library is documented in
[first-dream-walkthrough.md](./first-dream-walkthrough.md).

CLI shape once transcripts are available:

```bash
gotcontext-memory dream --source claude --store user --force
gotcontext-memory review list
gotcontext-memory review show <id>
gotcontext-memory review accept <id> --yes
```

---

## 6. Export a backup

```bash
gotcontext-memory export --out /tmp/backup.gcm.gz
```

---

## 7. Uninstall adapter fragments

```bash
gotcontext-memory uninstall --store user
```

Restores pre-images from the installer manifest.

Next → [first-dream-walkthrough.md](./first-dream-walkthrough.md)
