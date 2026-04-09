---
name: deploy
description: Pre-deploy checks — runs type-check and build as test gates, then prints success message if all pass.
allowed-tools: Bash
---

Deploy workflow for this project. Execute each step in order and stop immediately if any step fails.

## Steps

1. **Type-check** — run `pnpm tsc --noEmit` to catch type errors
2. **Build** — run `pnpm build` to produce the production bundle
3. **Result** — if both steps succeed, print to terminal:

```
✓ Success deploy!
```

If any step fails, print the error output and stop — do NOT print the success message.

## Rules

- Always run steps sequentially (type-check first, then build)
- Do not skip steps even if the user asks
- Do not amend or commit any files during this workflow
- Report each step result clearly before moving to the next
