import { spawn } from 'node:child_process';
import type { KaneResult, KaneStep, Verdict } from './types.ts';

/**
 * Kane CLI invocation config — VERIFIED against kane-cli 0.8.5.
 *   kane-cli testmd run <file> --agent [--url <url>]
 *   --agent  = plain NDJSON output, no colors/UI
 * Every env var below can override without touching code.
 */
export const KANE = {
  bin: process.env.KANE_BIN ?? 'kane-cli',
  /** Subcommand that executes a *_test.md flow. */
  runArgs: (process.env.KANE_RUN_ARGS ?? 'testmd run').split(' ').filter(Boolean),
  /** NDJSON / agent-readable output. */
  jsonFlag: process.env.KANE_JSON_FLAG ?? '--agent',
  /** Start URL for the first step. */
  targetFlag: process.env.KANE_TARGET_FLAG ?? '--url',
  /** Extra args appended to every run, e.g. --headless --max-steps 25 */
  extraArgs: (process.env.KANE_EXTRA_ARGS ?? '').split(' ').filter(Boolean),
  timeoutMs: Number(process.env.KANE_TIMEOUT_MS ?? 180_000),
};

export function kaneArgs(flowPath: string, target?: string): string[] {
  const args = [...KANE.runArgs, flowPath, KANE.jsonFlag];
  if (target && KANE.targetFlag) args.push(KANE.targetFlag, target);
  args.push(...KANE.extraArgs);
  return args;
}

/** Tolerant NDJSON reader: unknown shapes are skipped, never fatal. */
function parseNdjson(raw: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('{')) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      // Partial or non-JSON line (banner, progress bar) — ignore.
    }
  }
  return out;
}

function pick(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

const truthy = (v: unknown) =>
  v === true || v === 'pass' || v === 'PASS' || v === 'passed' || v === 'ok';

/**
 * Maps NDJSON events to a KaneResult without assuming an exact schema.
 * Field-name candidates are deliberately broad so a schema surprise
 * degrades to ERROR-with-raw rather than a crash.
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
  let videoPath: string | undefined;
  let declared: Verdict | undefined;

  for (const e of events) {
    const type = String(pick(e, ['type', 'event', 'kind']) ?? '');
    const video = pick(e, ['video', 'videoPath', 'video_path', 'trace', 'recording']);
    if (typeof video === 'string') videoPath = video;

    if (/step|action|assert/i.test(type)) {
      const text = pick(e, ['text', 'step', 'name', 'description', 'instruction']);
      if (typeof text === 'string') {
        const status = pick(e, ['status', 'result', 'verdict', 'ok', 'passed']);
        steps.push({
          index: steps.length,
          text,
          ok: status === undefined ? true : truthy(status),
          message: (pick(e, ['message', 'error', 'reason']) as string) ?? undefined,
        });
      }
    }

    const v = pick(e, ['verdict', 'status', 'result']);
    if (/run|result|summary|end|complete/i.test(type) && typeof v === 'string') {
      declared = truthy(v) ? 'PASS' : 'FAIL';
    }
  }

  const failedStep = steps.find((s) => !s.ok);
  let verdict: Verdict;
  if (declared) verdict = declared;
  else if (failedStep) verdict = 'FAIL';
  else if (exitCode === 0 && events.length > 0) verdict = 'PASS';
  else verdict = 'ERROR';

  return { verdict, flow, target, steps, failedStep, videoPath, durationMs, raw, stderr };
}

export function runKane(flowPath: string, target?: string): Promise<KaneResult> {
  const started = Date.now();
  const args = kaneArgs(flowPath, target);

  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(KANE.bin, args, { shell: process.platform === 'win32' });
    } catch (err) {
      return resolve(
        toResult('', `spawn failed: ${String(err)}`, -1, flowPath, 0, target),
      );
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
