# Runbook — the closed-loop demo

Run this from a **plain terminal** (PowerShell / WezTerm), not inside Claude Code.
Claude Code blocks nested sessions, so `claude -p` cannot spawn from within one.

## Terminal 1 — the app

```bash
bun run app          # http://localhost:3000
```

## Terminal 2 — the loop

```bash
bun demo-break.ts    # breaks the Run Verification button on purpose
bun loop.ts --ci --agent claude
```

Expected, on camera:

```
[1/4] kane → FAIL — button labelled "Run Verification" not found
      handing failure to claude…
[2/4] kane → PASS
      loop closed green
```

Kane catches a real regression, Claude reads `.kane-loop/failure.md`, patches
`app/index.html`, Kane re-verifies. No human in between.

**Cost:** ~20 credits per 4-step run, so budget ~40-60 for one full red→green.
Check first with `kane-cli balance`.

## Reset between takes

```bash
bun demo-break.ts --restore
```

## Zero-credit rehearsal

Rehearse the whole thing with recorded NDJSON and a stub agent, no credits:

```bash
echo fail > .kane-loop/stub-mode
KANE_BIN=bun KANE_RUN_ARGS=".kane-loop/stub-kane.ts" KANE_EXTRA_ARGS=" " \
KANE_LOOP_AGENT_CMD="bun .kane-loop/stub-agent.ts" \
bun loop.ts --agent custom --ci
```

## Watch mode (for the dashboard shot)

```bash
bun run loop         # verifies on every save under app/ or src/
```
