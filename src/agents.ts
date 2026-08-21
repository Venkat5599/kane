import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { KaneResult } from './types.ts';

export type AgentName = 'claude' | 'codex' | 'custom' | 'manual';

export interface RepairOutcome {
  ok: boolean;
  summary: string;
}

const FAILURE_FILE = '.kane-loop/failure.md';

/** The agent's entire input. Kept as a file so `manual` mode is a paste away. */
export function writeFailureBrief(r: KaneResult, triggerFile?: string): string {
  // null = omit this line entirely; '' = a real blank line worth keeping.
  const lines: (string | null)[] = [
    '# Kane verification failed',
    '',
    `- flow: \`${r.flow}\``,
    r.target ? `- target: ${r.target}` : null,
    triggerFile ? `- last edited: \`${triggerFile}\`` : null,
    `- duration: ${r.durationMs}ms`,
    r.credits ? `- credits spent: ${r.credits}` : null,
    r.videoPath ? `- trace: ${r.videoPath}` : null,
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
  ];
  const brief = lines.filter((l): l is string => l !== null).join('\n');

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
      // KANE_LOOP_AGENT_CMD lets any agent be wired in without a code change,
      // e.g. KANE_LOOP_AGENT_CMD="aider --message {prompt}"
      const custom = process.env.KANE_LOOP_AGENT_CMD;
      if (name === 'custom' || (custom && name !== 'manual')) {
        if (!custom) return { ok: false, summary: 'KANE_LOOP_AGENT_CMD is not set' };
        const parts = custom.split(' ').filter(Boolean);
        const bin = parts[0]!;
        const rest = parts.slice(1).map((a) => a.replace('{prompt}', PROMPT));
        return run(bin, rest, cwd);
      }

      switch (name) {
        case 'claude':
          // NOTE: cannot be spawned from inside a Claude Code session —
          // nested sessions are blocked. Run `bun loop.ts` in a plain terminal.
          return run('claude', ['-p', PROMPT], cwd);
        case 'codex':
          return run('codex', ['exec', PROMPT], cwd);
        case 'custom':
        case 'manual':
          console.log(`\n  Paste this to your agent:\n  > ${PROMPT}\n  (brief: ${FAILURE_FILE})\n`);
          return { ok: false, summary: 'manual mode — awaiting human relay' };
      }
    },
  };
}
