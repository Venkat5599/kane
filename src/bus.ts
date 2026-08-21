import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Iteration } from './types.ts';

type Listener = (it: Iteration) => void;

const listeners = new Set<Listener>();
const history: Iteration[] = [];
const LOG = '.kane-loop/iterations.jsonl';

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Replayed to every new SSE client so a late-joining judge sees prior rows. */
export function snapshot(): Iteration[] {
  return [...history];
}

export function publish(it: Iteration): void {
  history.push(it);
  try {
    mkdirSync(dirname(LOG), { recursive: true });
    appendFileSync(LOG, JSON.stringify(it) + '\n');
  } catch {
    // Logging is best-effort; never take the loop down over a write failure.
  }
  for (const fn of listeners) {
    try {
      fn(it);
    } catch {
      // A broken client must not break the publisher.
    }
  }
}
