# kane-loop — Build Checklist

Deadline **21 Aug 23:59 IST**. Tick in order. Do not skip P0.

## P0 — Eligibility gates (unscoreable without these)

- [ ] Register at https://www.testmuai.com/register/ — claim 10,000 credits
- [x] `npm install -g @testmuai/kane-cli`
- [ ] Authenticate Kane CLI (follow its login output)
- [ ] `kane-cli --help` — **record the real subcommand + JSON/NDJSON flag**
- [ ] Read https://www.testmuai.com/kane-cli/agents.md
- [ ] Patch `src/kane.ts` → `KANE` config block with the verified flags
- [ ] Run ONE flow green against any URL before touching app code
- [ ] Repo pushed public: `git branch -M main && git push -u origin main`

## P1 — App (primary flow, AC1)

- [x] `package.json`, scripts
- [x] `app/server.ts` — Bun.serve, `/`, `/api/run`, `/events` SSE
- [x] `app/index.html` — run form + iteration table, no JS-gated content
- [x] `src/bus.ts`, `src/types.ts`
- [ ] `bun run app` → load localhost:3000, submit a check, see a verdict row

## P2 — Loop (closed loop, AC3 — highest weight)

- [x] `src/kane.ts` — spawn + NDJSON parse + tolerant fallback
- [x] `src/agents.ts` — claude | codex | manual adapters
- [x] `loop.ts` — watcher, state machine, iteration cap
- [ ] `bun run loop` — save a file, watch Kane fire
- [ ] Force a FAIL → confirm `.kane-loop/failure.md` written
- [ ] Confirm agent spawns and edits (plain terminal, NOT inside Claude Code)
- [ ] Confirm re-verify fires and goes green unattended

## P3 — Hook + evidence

- [x] `.claude/settings.json` PostToolUse → `bun loop.ts --once`
- [ ] Verify hook fires on an Edit inside a Claude Code session
- [ ] Break Run Verification handler on purpose, capture full red→green
- [ ] Copy NDJSON + video traces into `evidence/`, commit (AC5)

## P4 — Ship

- [ ] `README.md` — install, one command, hook snippet, screenshot
- [ ] Clean-clone test: `git clone && bun install && bun run loop` (AC4)
- [ ] 3-min video — **loop footage in first 50s**, judges stop at 3:00
- [ ] Upload YouTube **Unlisted**, test link in incognito
- [ ] Write submission paragraph: what / who for / which agent / what Kane does
- [ ] Submit https://www.surveymonkey.com/r/kane-cli-hackathon-submission

## Cut-list if short on time

Protect AC3 above all. Drop in this order: README polish → `/api/run` ad-hoc
targets → hook → dashboard styling. Never drop the red→green footage.
