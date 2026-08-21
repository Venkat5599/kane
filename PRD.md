# kane-loop — Product Requirements

**Event:** Kane CLI Online Hackathon (TestMu AI) · **Deadline:** 21 Aug 2026, 23:59 IST
**Team size:** solo · **Agent used:** Claude Code (primary), Codex (fallback adapter)

---

## 1. One-liner

A local dev-loop daemon that runs Kane CLI against your app on every save, feeds the
failure back into a coding agent, and re-verifies — with a web console that streams
each iteration. The console is itself the app Kane verifies.

## 2. Problem

AI coding agents write code faster than anyone can check it. The unclosed part of the
loop is trust: when the agent ships, a human still opens a browser and clicks.
An agent that cannot observe its own output runs open-loop.

`kane-loop` closes it. Kane becomes the agent's eyes; the agent becomes Kane's hands.

## 3. Users

| User | Need |
|---|---|
| Dev using an AI agent | Know within seconds whether the agent's last edit broke a real user flow |
| The agent itself | A machine-readable verdict it can act on without a human relay |
| Hackathon judge | Load a URL, complete a flow, get a result, in under 30 seconds |

## 4. Primary flow (the "works end-to-end" bar)

The console is a **Kane run console**, not a passive log viewer.

1. User loads `http://localhost:3000`
2. Enters a target URL and a plain-English check
   (e.g. `"click Run Verification and assert a result row appears"`)
3. Clicks **Run Verification**
4. Kane executes against the target in a real browser
5. A result row streams in: verdict, failing step (if any), duration, video-trace link

A judge can complete this cold, with no prior state. Nothing mocked.

## 5. The closed loop (the scoring centrepiece)

Layered on top of the same console:

```
save file
  → watcher debounces 800ms
  → kane-loop runs the smoke flow
  → PASS: emit green iteration, idle
  → FAIL: write .kane-loop/failure.md (step, assertion, console excerpt, trace path)
        → spawn agent with that failure as context
        → agent edits src/
        → save fires watcher again  ──┐
        → iterate, max 4              │
                                      └── loop closes
```

Every iteration streams to the console live. The judge watches red become green.

## 6. Scope

**In**
- Kane run console (target URL + NL check → verdict), SSE-streamed
- `loop.ts` watcher + NDJSON parser + agent adapter (`--agent claude|codex`)
- Claude Code `PostToolUse` hook that fires a single verification per agent edit
- `evidence/` — committed NDJSON + video traces from a real run
- README with one-command install and the hook snippet

**Out (explicitly, for time)**
- Auth, multi-user, persistence beyond in-memory + JSONL append
- Hosting/VPS — local-only by design; `cloudflared` covers the optional live URL
- Any LLM SDK integration — the agent is a spawned CLI, no API key

## 7. Acceptance criteria

| # | Criterion | How proved |
|---|---|---|
| AC1 | App loads and primary flow returns a real verdict | Judge runs it; video 0:50–1:40 |
| AC2 | Kane caught a genuine regression during the build | Committed failing NDJSON in `evidence/` |
| AC3 | A Kane failure caused an agent edit with no human in between | Video 0:00–0:50, loop log |
| AC4 | Runs from clean clone with one command | `git clone && bun install && bun run loop` |
| AC5 | Survives Kane/network outage at judging time | `evidence/` recorded run + README pointer |

AC3 is the highest-weighted. If time runs short, protect it over everything else.

## 8. Rubric mapping

| Judge dimension | Our evidence |
|---|---|
| Ships | Real Bun server, real browser, real verdict, one command |
| Verified | Kane exercises the console's own primary flow; failures captured |
| Closed loop | Kane verdict → agent patch → Kane rerun, unattended, on camera |
| Craft | Recursive self-verification; installable in one line tonight |

## 9. Milestones (T = build start)

| Window | Deliverable | Guard |
|---|---|---|
| T+0:00–0:20 | testmuai signup, `kane-cli` installed + authed, **one flow green** | Hard gate. Do not write app code first |
| T+0:20–1:20 | Console: server, SSE, run form, result table | Ugly is fine |
| T+1:20–2:30 | `loop.ts`: watcher, NDJSON parse, agent adapter | Cap subprocess debugging at 25 min |
| T+2:30–3:00 | Claude Code hook | ~30 lines |
| T+3:00–3:30 | Scripted regression, capture `evidence/` | The money shot |
| T+3:30–4:00 | README, polish, `bun run loop` verified from clean clone | |
| T+4:00–4:45 | 3-min video, unlisted, tested in incognito | Loop footage first |
| T+4:45 | Submit form | |

## 10. Risks

| Risk | Mitigation |
|---|---|
| Kane CLI flags differ from assumption | Confirm via `kane-cli --help` + `testmuai.com/kane-cli/agents.md` in first 15 min. **No flag is committed to code before it is verified.** |
| `claude -p` blocked as subprocess | Nested Claude Code sessions are blocked — run loop from a plain terminal, or use `--agent codex` |
| Agent subprocess plumbing eats the clock | Hard 25-min cap, then degrade to `failure.md` + manual paste on camera. Still scores Closed loop, lower |
| Credits exhausted | Replays cache free; DM organisers on Slack early, not at hour five |
| Video overruns 3:00 | Judges stop watching at 3:00. Loop footage in the first 50 seconds |

## 11. Eligibility checklist

- [ ] TestMu AI account registered (**hard gate — unscoreable without it**)
- [ ] Kane CLI installed and actually run
- [ ] Repo `git init`'d on/after 19 Aug
- [ ] Public repo + README with setup steps
- [ ] 3-min video, **unlisted** (not private), link tested in incognito
- [ ] One paragraph: what, who for, which agent, what Kane does
- [ ] Runnable command or live URL
- [ ] Submitted before 23:59 IST 21 Aug — submissions lock, no post-deadline pushes
