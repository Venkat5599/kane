# kane-loop — Architecture

**Repo:** https://github.com/Venkat5599/kane
**Stack:** TypeScript on Bun · no framework · no LLM SDK · no hosting

---

## 1. Topology

Everything is local. Four processes on one machine.

```
┌─ terminal 1 ─────────────┐     ┌─ terminal 2 ────────────────────────┐
│ bun app/server.ts        │     │ bun loop.ts --agent claude          │
│ :3000  console + SSE     │◄────┤ watcher → kane → parse → agent      │
└──────────┬───────────────┘     └──────┬──────────────────┬───────────┘
           │                            │ spawn            │ spawn
           │                     ┌──────▼──────┐    ┌──────▼──────────┐
           │                     │ kane-cli    │    │ claude -p       │
           │                     │ real Chrome │    │ or codex exec   │
           │                     └──────┬──────┘    └──────┬──────────┘
           │                            │ drives           │ edits
           └────────────────────────────┘                  ▼
                    localhost:3000                       src/
```

The loop verifies the very app that renders the loop. Kane's target is `localhost:3000`.

**Constraint:** `claude -p` cannot be spawned from inside a Claude Code session
(nested sessions are blocked). Run `loop.ts` from a plain terminal for the
`claude` adapter; `codex` works from either.

## 2. File tree

```
kane/
├── PRD.md
├── ARCHITECTURE.md
├── README.md
├── package.json
├── app/
│   ├── server.ts          # Bun.serve — static, /api/run, /events (SSE)
│   └── index.html         # console: run form + iteration table
├── loop.ts                # watcher + orchestrator (entrypoint)
├── src/
│   ├── kane.ts            # spawn kane-cli, parse NDJSON → KaneResult
│   ├── agents.ts          # AgentAdapter: claude | codex
│   ├── bus.ts             # in-memory pub/sub feeding SSE
│   └── types.ts
├── flows/
│   └── smoke_test.md      # the Kane flow verifying the console
├── .claude/settings.json  # PostToolUse hook → single verification per edit
├── .kane-loop/            # runtime scratch (gitignored except evidence)
│   └── failure.md         # latest failure, the agent's input
└── evidence/              # committed: real NDJSON + video traces (AC5)
```

## 3. Data model

```ts
type Verdict = 'PASS' | 'FAIL' | 'ERROR';

interface KaneResult {
  verdict: Verdict;
  flow: string;
  steps: { text: string; ok: boolean; message?: string }[];
  failedStep?: { index: number; text: string; message: string };
  videoPath?: string;
  durationMs: number;
  raw: string;            // full NDJSON, always retained for evidence/
}

interface Iteration {
  n: number;
  trigger: 'save' | 'manual' | 'hook';
  triggerFile?: string;
  result: KaneResult;
  patchSummary?: string;  // present when an agent edited in response
  at: string;             // ISO
}
```

`Iteration[]` lives in memory and appends to `.kane-loop/iterations.jsonl`.
No database.

## 4. Kane adapter — `src/kane.ts`

> ⚠️ **Every Kane CLI flag below is a placeholder.** Confirm against
> `kane-cli --help` and `testmuai.com/kane-cli/agents.md` before writing code.
> Do not commit a guessed flag.

```
spawn: kane-cli <run-subcommand> flows/smoke_test.md --<json-flag>
read:  stdout as NDJSON, one JSON object per line
map:   line events → KaneResult (verdict, per-step ok, video path)
on non-zero exit with unparseable output → verdict: 'ERROR', surface raw
```

Parser is line-oriented and tolerant: unknown event types are ignored, never fatal.
Raw output is always kept so `evidence/` is a byproduct, not extra work.

## 5. Agent adapter — `src/agents.ts`

```ts
interface AgentAdapter {
  name: 'claude' | 'codex';
  repair(failure: string, cwd: string): Promise<{ ok: boolean; summary: string }>;
}
```

- `claude` → `claude -p "<prompt>"`
- `codex`  → `codex exec "<prompt>"`

Prompt is assembled from `.kane-loop/failure.md`: the failing step text, the
assertion message, a console excerpt, and the trace path. Selected by
`--agent`, defaulting to `claude`.

**Degradation path:** if subprocess spawning fights back past the 25-minute cap,
the adapter writes `failure.md` and prints a paste-ready block. The loop still
runs end-to-end with a human relay — lower score on Closed loop, non-zero.

## 6. Loop state machine — `loop.ts`

```
IDLE ──watch(src/, app/) debounce 800ms──► VERIFYING
VERIFYING ──PASS──► emit green ──► IDLE   (iteration counter resets)
VERIFYING ──FAIL──► write failure.md ──► REPAIRING
REPAIRING ──agent edits──► (watcher refires) ──► VERIFYING
REPAIRING ──no edit made──► emit stalled ──► IDLE
any ──iteration > 4──► BAILED (emit loudly, stop; never loop forever)
```

`--once` runs a single VERIFYING pass and exits — this is what the hook calls.

## 7. Console — `app/server.ts`

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | `index.html` |
| `/api/run` | POST | `{ targetUrl, check }` → runs Kane ad-hoc → returns `KaneResult` |
| `/events` | GET | SSE stream of `Iteration` objects from `bus.ts` |
| `/evidence/*` | GET | serves recorded traces |

SSE payload: `event: iteration` + `data: <Iteration JSON>`. Client appends a row.

**Content renders without JS-gated reveals** — the table and form are present in
the initial HTML. An empty stream must still yield a fully usable page, since the
judge's first action is completing the primary flow, not watching the loop.

## 8. Claude Code hook — `.claude/settings.json`

`PostToolUse` matching `Edit|Write` → `bun loop.ts --once`.

Effect: every agent file edit inside a Claude Code session triggers one Kane
verification, streamed to the console. This is the tightest available coupling
between agent output and browser-verified truth, and it is ~30 lines.

## 9. Failure handling

| Condition | Behaviour |
|---|---|
| `kane-cli` not on PATH | Fail fast at startup with the install command |
| Not authenticated / out of credits | Surface Kane's own stderr verbatim, do not retry-storm |
| NDJSON unparseable | `verdict: 'ERROR'`, keep raw, keep serving |
| Agent makes no edit | Mark iteration `stalled`, return to IDLE, no infinite retry |
| Iteration cap hit | `BAILED`, loud console row, human takes over |
| Target server down | `ERROR` with a clear "is app/server.ts running?" hint |

## 10. Security notes

- `/api/run` takes a user-supplied URL and drives a real browser at it. Local-only
  binding (`127.0.0.1`) is the mitigation for the hackathon; this is **not**
  safe to expose publicly as-is — an exposed instance is an SSRF/browser-driving
  primitive for anyone who can reach it.
- If `cloudflared` is used for the optional judge URL, treat that tunnel as
  temporary and shut it down after judging.
- Kane credentials live in Kane's own config. Never read, log, or commit them.
  `.kane-loop/` and any auth file stay gitignored.

## 11. Deliberate non-goals

No VPS, no Docker, no auth, no DB, no LLM API key, no framework. Each would cost
build time and buy nothing the rubric rewards.
