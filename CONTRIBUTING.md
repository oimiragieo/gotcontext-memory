# Contributing

Thanks for helping. This package is **HITL markdown memory** — read
[docs/HONESTY.md](docs/HONESTY.md) before proposing LLM/auto-apply behavior.

## Report a bug or request a feature

Use the issue forms (blank issues are disabled):

**→ https://github.com/oimiragieo/gotcontext-memory/issues/new/choose**

- **Bug report** — area, version, OS, Node, steps, evidence  
- **Feature request** — problem, proposed shape, honesty check  

Questions → [Discussions](https://github.com/oimiragieo/gotcontext-memory/discussions).

Maintainers process `needs-triage` issues weekly (AI-assisted). See
[docs/guides/issue-triage-weekly.md](docs/guides/issue-triage-weekly.md).

## Dev loop

```bash
npm install
npm run build
npm test
npm run lint
```

Junior rebuild path: [docs/guides/rebuild-from-scratch.md](docs/guides/rebuild-from-scratch.md).

## Pull requests

- Prefer small PRs with tests for the behavior you change.  
- Do not claim omega `memory_dream` / LLM parity.  
- Stage only your paths on a dirty tree.  
- Secrets: never commit live-shaped tokens (split fixtures).
