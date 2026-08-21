import { file } from 'bun';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publish, snapshot, subscribe } from '../src/bus.ts';
import { runKane } from '../src/kane.ts';
import type { Iteration } from '../src/types.ts';

const PORT = Number(process.env.PORT ?? 3000);
let counter = snapshot().length;

/** Writes an ad-hoc NL check to a temp *_test.md — the format Kane's testmd expects. */
function writeAdHocFlow(check: string, targetUrl: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'kane-loop-'));
  const path = join(dir, 'adhoc_test.md');
  writeFileSync(
    path,
    ['---', `url: ${targetUrl}`, 'name: ad-hoc check', '---', '', `## ${check}`, ''].join('\n'),
  );
  return path;
}

const server = Bun.serve({
  port: PORT,
  hostname: '127.0.0.1', // local-only: /api/run drives a real browser at a given URL
  idleTimeout: 255,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/') {
      return new Response(file('app/index.html'), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
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
        return Response.json({ error: 'targetUrl and check are both required' }, { status: 400 });
      }
      const flowPath = writeAdHocFlow(check, targetUrl);
      const result = await runKane(flowPath, targetUrl);
      const it: Iteration = {
        n: ++counter,
        trigger: 'manual',
        result: { ...result, flow: check },
        at: new Date().toISOString(),
      };
      publish(it);
      return Response.json(it);
    }

    return new Response('not found', { status: 404 });
  },
});

console.log(`kane-loop console  →  http://localhost:${server.port}`);
