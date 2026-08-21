import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { KaneResult } from './types.ts';

export type AgentName = 'claude' | 'codex' | 'manual';

export interface RepairOutcome {
  ok: boolean;
  summary: string;
}

const FAILURE_FILE = '.kane-loop/failure.md';

/** The agent's entire input. Kept as a file so `manual` mode is a paste away. */
export function writeFailureBrief(r: KaneResult, triggerFile?: string): string {
  const brief = [
    '# Kane verification failed',
    '',
    `- flow: \`${r.flow}\``,
    r.target ? `- target: ${r.target}` : '',
    triggerFile ? `- last edited: \`${triggerFile}\`` : '',
    `- duration: ${r.durationMs}ms`,
    r.videoPath ? `- trace: ${r.videoPath}` : '',
    '',
    '## Failing step',
    '',
    r.failedStep
      ? `Step ${r.failedStep.index + 1}: ${r.failedStep.text}\n\n> ${r.failedStep.message ?? 'assertion did not hold'}`
      : '_No explicit failing step reported — see raw output._',
    '',
    '## All steps',
    '',
    ...r.steps.map((s) => `${s.ok ? 'ok  ' : 'FAIL'} ${s.index + 1}. ${s.text}${s.message ? ` — ${s.message}` : ''}`),
    '',
    '## Raw Kane output (tail)',
    '',
    '```',
    r.raw.split('\n').slice(-40).join('\n'),
    '```',
    r.stderr ? `\n## stderr\n\n\`\`\`\n${r.stderr.slice(-2000)}\n\`\`\`` : '',
    '',
    '## Your task',
    '',
    'Fix the application source so this flow passes. Edit files under `app/` or',
    '`src/`. Change nothing in `flows/` — the test defines the contract, and',
    'weakening it to force a pass is not a fix. Make the smallest correct change.',
  ]
    .filter(Boolean)
    .join('\n');

  mkdirSync('.kane-loop', { recursive: true });
  writeFileSync(FAILURE_FILE, brief);
  return brief;
}

function run(bin: string, args: string[], cwd: string): Promise<RepairOutcome> {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(bin, args, { cwd, shell: process.platform === 'win32' });
    } catch (e) {
      return resolve({ ok: false, summary: `spawn failed: ${String(e)}` });
    }
    let out = '';
    child.stdout?.on('data', (d) => {
      const s = d.toString();
      out += s;
      process.stdout.write(s);
    });
    child.stderr?.on('data', (d) => (out += d.toString()));
    child.on('error', (e) =>
      resolve({ ok: false, summary: `${bin} unavailable: ${String(e)}` }),
    );
    child.on('close', (code) =>
      resolve({
        ok: code === 0,
        summary: out.trim().split('\n').slice(-6).join(' ').slice(0, 400) || `exit ${code}`,
      }),
    );
  });
}

const PROMPT =
  'Read .kane-loop/failure.md. A browser verification of this app just failed. ' +
  'Fix the application source so the flow passes. Do not edit files in flows/. ' +
  'Make the smallest correct change, then stop.';

export function getAgent(name: AgentName) {
  return {
    name,
    async repair(cwd: string): Promise<RepairOutcome> {
      switch (name) {
        case 'claude':
          // NOTE: cannot be spawned from inside a Claude Code session —
          // nested sessions are blocked. Run `bun loop.ts` in a plain terminal.
          return run('claude', ['-p', PROMPT], cwd);
        case 'codex':
          return run('codex', ['exec', PROMPT], cwd);
        case 'manual':
          console.log(`\n  Paste this to your agent:\n  > ${PROMPT}\n  (brief: ${FAILURE_FILE})\n`);
          return { ok: false, summary: 'manual mode — awaiting human relay' };
      }
    },
  };
}
