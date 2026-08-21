# kane-loop

**Live:** https://kane-loop.vercel.app

**Build it with any agent. Verify it with Kane. Let the agent read the verdict.**

A local dev-loop daemon: Kane CLI runs against your app on every save, and when a
flow fails the failure goes straight back to your coding agent, which patches the
code, which fires Kane again. A web console streams every iteration.

The console is itself the app Kane verifies.

---

## Quick start

```bash
npm install -g @testmuai/kane-cli
kane-cli login --oauth          # 10,000 free credits at testmuai.com/register

git clone https://github.com/Venkat5599/kane && cd kane
bun install

bun run app                     # terminal 1 — console on :3000
bun run loop                    # terminal 2 — watcher + Kane + agent
```

Then edit anything under `app/` or `src/` and watch the console.

> With `--agent claude`, run `bun run loop` from a **plain terminal**. Claude Code
> blocks nested sessions, so the spawn fails from inside one. `--agent codex`
> works from either.

## The primary flow

Load `http://localhost:3000`, enter a target URL and a check in plain English,
click **Run Verification**. Kane drives a real Chrome window and a result row
streams back with the verdict, the failing step, and the trace.

## The loop

```
save → kane-cli testmd run flows/smoke_test.md --agent
     → PASS: green row, idle
     → FAIL: .kane-loop/failure.md → agent → edits → save → …
     → 4 iterations without green: bail loudly
```

## Wire it into Claude Code

`.claude/settings.json` fires one verification per agent edit:

```json
{ "hooks": { "PostToolUse": [ { "matcher": "Edit|Write",
  "hooks": [ { "type": "command", "command": "bun loop.ts --once" } ] } ] } }
```

Kane also ships its own agent skill: `kane-cli install claude-code`.

## Commands

| Command | Does |
|---|---|
| `bun run app` | Console + SSE on :3000 |
| `bun run loop` | Watch, verify, repair |
| `bun run once` | One verification, write the brief, no agent |
| `bun loop.ts --agent codex --max 6` | Pick agent / iteration cap |

## Config

Kane invocation lives in one block, `src/kane.ts` → `KANE`, overridable by env:
`KANE_BIN`, `KANE_RUN_ARGS`, `KANE_JSON_FLAG`, `KANE_TARGET_FLAG`,
`KANE_EXTRA_ARGS`, `KANE_TIMEOUT_MS`.

## Layout

```
app/server.ts     Bun.serve — /, /api/run, /events (SSE)
app/index.html    the console
loop.ts           watcher + state machine
src/kane.ts       spawn kane-cli, parse NDJSON
src/agents.ts     claude | codex | manual adapters
flows/            the Kane flow verifying this app
evidence/         recorded NDJSON + traces
```

## A note on exposure

`/api/run` takes a URL and drives a real browser at it, so the server binds to
`127.0.0.1` only. Do not expose it publicly as-is — an open instance is a
browser-driving primitive for anyone who can reach it. If you tunnel it for a
demo, close the tunnel afterwards.

## Docs

[PRD](./PRD.md) · [Architecture](./ARCHITECTURE.md) · [Checklist](./TODO.md)
