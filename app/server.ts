import { file } from 'bun';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publish, snapshot, subscribe } from '../src/bus.ts';
import { runKane } from '../src/kane.ts';
import type { Iteration } from '../src/types.ts';

const PORT = Number(process.env.PORT ?? 3000);
// 127.0.0.1 by default. Set HOST=0.0.0.0 only for a deployed instance, and
// only with the budget guards below configured — /api/run drives a real
// browser at an arbitrary URL and spends real Kane credits.
const HOST = process.env.HOST ?? '127.0.0.1';
const PUBLIC = HOST !== '127.0.0.1';

/** Hard ceiling on credits this process will ever spend. */
const CREDIT_BUDGET = Number(process.env.KANE_CREDIT_BUDGET ?? (PUBLIC ? 400 : Infinity));
/** Per-IP runs allowed inside the rolling window. */
const RATE_LIMIT = Number(process.env.KANE_RATE_LIMIT ?? 3);
const RATE_WINDOW_MS = Number(process.env.KANE_RATE_WINDOW_MS ?? 15 * 60_000);

let spent = snapshot().reduce((t, i) => t + (i.result.credits ?? 0), 0);
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

let counter = snapshot().length;

/** Writes an ad-hoc NL check to a temp *_test.md — the format Kane's testmd expects. */
function writeAdHocFlow(check: string, targetUrl: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'kane-loop-'));
  const path = join(dir, 'adhoc_test.md');
  // kane-cli 0.8.5: `url` is the only valid frontmatter key, and the objective
  // is the BODY under a `## ` heading — a heading on its own yields an empty
  // objective and the step fails.
  writeFileSync(
    path,
    ['---', `url: ${targetUrl}`, '---', '', '## Ad-hoc check', '', check, ''].join('\n'),
  );
  return path;
}

const server = Bun.serve({
  port: PORT,
  hostname: HOST, // 127.0.0.1 unless HOST is set — see the guards above
  idleTimeout: 255,
  async fetch(req) {
    const url = new URL(req.url);

    // The hosted dashboard talks to this local server from another origin.
    // Only same-machine instances are reachable anyway (127.0.0.1 by default).
    const cors: Record<string, string> = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    };
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/') {
      return new Response(file('app/index.html'), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    // Answer the favicon request so the demo console stays free of 404 noise.
    if (url.pathname === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    if (url.pathname === '/events') {
      let unsub = () => {};
      const stream = new ReadableStream({
        start(ctrl) {
          const enc = new TextEncoder();
          const send = (it: Iteration) =>
            ctrl.enqueue(enc.encode(`event: iteration\ndata: ${JSON.stringify(it)}\n\n`));
          for (const it of snapshot()) send(it);
          ctrl.enqueue(enc.encode(': connected\n\n'));
          unsub = subscribe(send);
        },
        cancel() {
          unsub();
        },
      });
      return new Response(stream, {
        headers: {
          ...cors,
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        },
      });
    }

    if (url.pathname === '/api/run' && req.method === 'POST') {
      const { targetUrl, check } = (await req.json()) as {
        targetUrl?: string;
        check?: string;
      };
      if (!targetUrl || !check) {
        return Response.json({ error: 'targetUrl and check are both required' }, { status: 400, headers: cors });
      }
      if (!/^https?:\/\//i.test(targetUrl)) {
        return Response.json({ error: 'targetUrl must start with http:// or https://' }, { status: 400, headers: cors });
      }
      if (spent >= CREDIT_BUDGET) {
        return Response.json(
          { error: 'This instance has spent its credit budget. Clone the repo and run it locally.' },
          { status: 429, headers: cors },
        );
      }
      const ip = server.requestIP(req)?.address ?? req.headers.get('x-forwarded-for') ?? 'local';
      if (PUBLIC && rateLimited(ip)) {
        return Response.json(
          { error: `Rate limit: ${RATE_LIMIT} runs per ${Math.round(RATE_WINDOW_MS / 60000)} minutes.` },
          { status: 429, headers: cors },
        );
      }
      const flowPath = writeAdHocFlow(check, targetUrl);
      const result = await runKane(flowPath, targetUrl);
      spent += result.credits ?? 0;
      const it: Iteration = {
        n: ++counter,
        trigger: 'manual',
        result: { ...result, flow: check },
        at: new Date().toISOString(),
      };
      publish(it);
      return Response.json(it, { headers: cors });
    }

    return new Response('not found', { status: 404 });
  },
});

console.log(`kane-loop console  →  http://localhost:${server.port}`);
