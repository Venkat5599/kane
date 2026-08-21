import { spawn } from 'node:child_process';
import type { KaneResult, KaneStep, Verdict } from './types.ts';

/**
 * Kane CLI invocation — VERIFIED against kane-cli 0.8.5.
 *   kane-cli testmd run <file> --agent [--url <url>]
 *   --agent = plain NDJSON, no colors/UI
 * Every value is env-overridable; nothing else hardcodes CLI syntax.
 */
export const KANE = {
  bin: process.env.KANE_BIN ?? 'kane-cli',
  runArgs: (process.env.KANE_RUN_ARGS ?? 'testmd run').split(' ').filter(Boolean),
  jsonFlag: process.env.KANE_JSON_FLAG ?? '--agent',
  targetFlag: process.env.KANE_TARGET_FLAG ?? '--url',
  extraArgs: (process.env.KANE_EXTRA_ARGS ?? '--max-steps 20').split(' ').filter(Boolean),
  timeoutMs: Number(process.env.KANE_TIMEOUT_MS ?? 300_000),
};

export function kaneArgs(flowPath: string, target?: string): string[] {
  const args = [...KANE.runArgs, flowPath, KANE.jsonFlag];
  if (target && KANE.targetFlag) args.push(KANE.targetFlag, target);
  // Non-interactive auth for headless/hosted use. OAuth needs a browser, so a
  // container authenticates with basic credentials supplied as env secrets.
  const user = process.env.KANE_USERNAME;
  const key = process.env.KANE_ACCESS_KEY;
  if (user && key) args.push('--username', user, '--access-key', key);
  args.push(...KANE.extraArgs);
  return args;
}

interface Ev {
  type?: string;
  [k: string]: unknown;
}

function parseNdjson(raw: string): Ev[] {
  const out: Ev[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('{')) continue;
    try {
      out.push(JSON.parse(t) as Ev);
    } catch {
      // Banner / partial line — ignore, never fatal.
    }
  }
  return out;
}

/**
 * Maps kane-cli 0.8.5 NDJSON to a KaneResult.
 *
 * Observed event flow per test.md:
 *   test_md_step_start { step_index, heading }
 *     run_start / step_start / step_event / step_end
 *     run_end { status, summary, one_liner, reason, credits_consumed }
 *   test_md_step_end   { step_index, status, duration_s }
 *   test_md_summary    { overall_status, steps{...} }
 *   test_md_done       { overall_status, share_url }
 */
export function toResult(
  raw: string,
  stderr: string,
  exitCode: number,
  flow: string,
  durationMs: number,
  target?: string,
): KaneResult {
  const events = parseNdjson(raw);
  const steps: KaneStep[] = [];
  const headings = new Map<number, string>();
  const reasons = new Map<number, string>();

  let overall: string | undefined;
  let shareUrl: string | undefined;
  let sessionId: string | undefined;
  let credits = 0;
  let current = -1;

  for (const e of events) {
    switch (e.type) {
      case 'test_md_step_start': {
        current = Number(e.step_index ?? 0);
        headings.set(current, String(e.heading ?? `Step ${current}`));
        break;
      }
      case 'run_end': {
        // Carries the human-readable reason for the step that just ran.
        const reason = String(e.reason || e.summary || e.one_liner || '').trim();
        if (current >= 0 && reason) reasons.set(current, reason);
        credits += Number(e.credits_consumed ?? 0);
        break;
      }
      case 'test_md_step_end': {
        const idx = Number(e.step_index ?? current);
        const status = String(e.status ?? '');
        steps.push({
          index: steps.length,
          text: headings.get(idx) ?? `Step ${idx}`,
          ok: status === 'passed',
          message: status === 'passed' ? undefined : reasons.get(idx) || status || 'step did not pass',
        });
        break;
      }
      case 'test_md_summary':
        overall = String(e.overall_status ?? '');
        break;
      case 'test_md_done':
        overall = String(e.overall_status ?? overall ?? '');
        if (typeof e.share_url === 'string') shareUrl = e.share_url;
        if (typeof e.session_id === 'string') sessionId = e.session_id;
        break;
    }
  }

  const failedStep = steps.find((s) => !s.ok);
  let verdict: Verdict;
  if (overall === 'passed') verdict = 'PASS';
  else if (overall === 'failed') verdict = 'FAIL';
  else if (failedStep) verdict = 'FAIL';
  else if (steps.length > 0 && exitCode === 0) verdict = 'PASS';
  else verdict = 'ERROR';

  return {
    verdict,
    flow,
    target,
    steps,
    failedStep,
    // Passing runs are not uploaded, so no share_url — fall back to the
    // local evidence pack, viewable with `kane-cli evidence serve <session>`.
    videoPath: shareUrl ?? (sessionId ? `session:${sessionId}` : undefined),
    credits: Number(credits.toFixed(3)),
    durationMs,
    raw,
    stderr,
  };
}

export function runKane(flowPath: string, target?: string): Promise<KaneResult> {
  const started = Date.now();
  const args = kaneArgs(flowPath, target);

  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(KANE.bin, args, { shell: process.platform === 'win32' });
    } catch (err) {
      return resolve(toResult('', `spawn failed: ${String(err)}`, -1, flowPath, 0, target));
    }

    let out = '';
    let err = '';
    const timer = setTimeout(() => child.kill(), KANE.timeoutMs);

    child.stdout?.on('data', (d) => (out += d.toString()));
    child.stderr?.on('data', (d) => (err += d.toString()));

    child.on('error', (e) => {
      clearTimeout(timer);
      const hint =
        (e as NodeJS.ErrnoException).code === 'ENOENT'
          ? `${KANE.bin} not found on PATH. Run: npm install -g @testmuai/kane-cli`
          : String(e);
      resolve(toResult(out, hint, -1, flowPath, Date.now() - started, target));
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve(toResult(out, err, code ?? -1, flowPath, Date.now() - started, target));
    });
  });
}
