/**
 * kane-loop orchestrator.
 *
 *   bun loop.ts                 watch + verify + repair, until green
 *   bun loop.ts --once          single verification (what the hook calls)
 *   bun loop.ts --agent codex   pick the repair agent
 *
 * NOTE: with `--agent claude`, run this from a PLAIN terminal. Claude Code
 * blocks nested sessions, so the spawn will fail inside one.
 */
import { watch } from 'node:fs';
import { existsSync } from 'node:fs';
import { publish } from './src/bus.ts';
import { getAgent, writeFailureBrief, type AgentName } from './src/agents.ts';
import { runKane } from './src/kane.ts';
import type { Iteration, Trigger } from './src/types.ts';

const argv = process.argv.slice(2);
const flag = (n: string, d?: string) => {
  const i = argv.indexOf(n);
  return i >= 0 ? (argv[i + 1] ?? d) : d;
};

const ONCE = argv.includes('--once');
const AGENT = (flag('--agent', 'claude') as AgentName);
const FLOW = flag('--flow', 'flows/smoke_test.md')!;
const TARGET = flag('--url', 'http://localhost:3000')!;
const MAX_ITER = Number(flag('--max', '4'));
const WATCH_DIRS = ['app', 'src'];
const DEBOUNCE = 800;

let counter = 0;
let busy = false;
let queued: { trigger: Trigger; file?: string } | null = null;

function log(msg: string) {
  console.log(`  ${msg}`);
}

async function verifyAndRepair(trigger: Trigger, triggerFile?: string, depth = 1): Promise<void> {
  if (depth > MAX_ITER) {
    log(`BAILED — ${MAX_ITER} iterations without green. Human takes over.`);
    return;
  }

  log(`[${depth}/${MAX_ITER}] kane → ${FLOW}${triggerFile ? `  (${triggerFile})` : ''}`);
  const result = await runKane(FLOW, TARGET);

  const it: Iteration = {
    n: ++counter,
    trigger,
    triggerFile,
    result,
    at: new Date().toISOString(),
  };

  if (result.verdict === 'PASS') {
    publish(it);
    log(`PASS in ${(result.durationMs / 1000).toFixed(1)}s`);
    return;
  }

  if (result.verdict === 'ERROR') {
    publish(it);
    log(`ERROR — ${result.stderr?.split('\n')[0] ?? 'unparseable output'}`);
    log('Not asking the agent to fix an infrastructure error. Check Kane auth and that the app is running.');
    return;
  }

  log(`FAIL — ${result.failedStep?.text ?? 'see trace'}`);
  writeFailureBrief(result, triggerFile);

  if (ONCE) {
    publish(it);
    log('--once: brief written to .kane-loop/failure.md, not invoking agent.');
    return;
  }

  log(`handing failure to ${AGENT}…`);
  const outcome = await getAgent(AGENT).repair(process.cwd());
  it.agent = AGENT;
  it.patchSummary = outcome.summary;
  if (!outcome.ok) it.stalled = true;
  publish(it);

  if (!outcome.ok) {
    log(`agent did not complete — ${outcome.summary}`);
    return;
  }

  // The agent's edits normally re-trigger the watcher; verify inline so
  // --once-style and quiet-edit cases still close the loop.
  await verifyAndRepair('save', triggerFile, depth + 1);
}

async function schedule(trigger: Trigger, file?: string) {
  if (busy) {
    queued = { trigger, file };
    return;
  }
  busy = true;
  try {
    await verifyAndRepair(trigger, file);
  } finally {
    busy = false;
    if (queued) {
      const q = queued;
      queued = null;
      void schedule(q.trigger, q.file);
    }
  }
}

if (!existsSync(FLOW)) {
  console.error(`flow not found: ${FLOW}`);
  process.exit(1);
}

if (ONCE) {
  await schedule('hook');
  process.exit(0);
}

console.log(`kane-loop  flow=${FLOW}  target=${TARGET}  agent=${AGENT}  max=${MAX_ITER}`);
console.log(`watching ${WATCH_DIRS.join(', ')} — save a file to fire a verification\n`);

let timer: ReturnType<typeof setTimeout> | undefined;
for (const dir of WATCH_DIRS) {
  if (!existsSync(dir)) continue;
  watch(dir, { recursive: true }, (_e, filename) => {
    if (!filename || /node_modules|\.kane-loop/.test(String(filename))) return;
    clearTimeout(timer);
    timer = setTimeout(() => void schedule('save', `${dir}/${filename}`), DEBOUNCE);
  });
}

await schedule('boot');
