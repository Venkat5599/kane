"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Play, Radio } from "lucide-react";

type Step = { text: string; ok: boolean; message?: string };
type Result = {
  verdict: "PASS" | "FAIL" | "ERROR";
  flow: string;
  steps: Step[];
  failedStep?: Step;
  credits?: number;
  durationMs?: number;
  stderr?: string;
};
type Iteration = {
  n: number;
  trigger: string;
  triggerFile?: string;
  agent?: string;
  patchSummary?: string;
  result: Result;
  at: string;
};

const DEFAULT_BASE = "http://localhost:3000";
const STORE_KEY = "kane-loop:base";

function readStored(): string {
  try {
    return localStorage.getItem(STORE_KEY) ?? DEFAULT_BASE;
  } catch {
    return DEFAULT_BASE;
  }
}

function verdictTone(v: string): string {
  if (v === "PASS") return "text-emerald-700 dark:text-emerald-400";
  if (v === "FAIL") return "text-orange-700 dark:text-orange-400";
  return "text-amber-700 dark:text-amber-400";
}

export function LiveConsole(): ReactNode {
  const [base, setBase] = useState(DEFAULT_BASE);
  const [status, setStatus] = useState<"offline" | "live" | "connecting">(
    "connecting"
  );
  const [rows, setRows] = useState<Iteration[]>([]);
  const [target, setTarget] = useState("https://example.com");
  const [check, setCheck] = useState(
    "Assert that the page heading reads Example Domain"
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setBase(readStored());
  }, []);

  const connect = useCallback((url: string) => {
    esRef.current?.close();
    setStatus("connecting");
    try {
      const es = new EventSource(`${url.replace(/\/$/, "")}/events`);
      esRef.current = es;
      es.onopen = () => setStatus("live");
      es.onerror = () => setStatus("offline");
      es.addEventListener("iteration", (e) => {
        try {
          const it = JSON.parse((e as MessageEvent).data) as Iteration;
          setRows((prev) =>
            prev.some((p) => p.n === it.n && p.at === it.at)
              ? prev
              : [it, ...prev]
          );
        } catch {
          /* ignore malformed frame */
        }
      });
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    if (!base) return;
    connect(base);
    return () => esRef.current?.close();
  }, [base, connect]);

  function saveBase(next: string) {
    setBase(next);
    try {
      localStorage.setItem(STORE_KEY, next);
    } catch {
      /* private mode — connection still works for this session */
    }
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("Kane is driving a real browser…");
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetUrl: target, check }),
      });
      const data = await res.json();
      if (data.error) {
        setNote(data.error);
      } else {
        setRows((prev) => [data as Iteration, ...prev]);
        setNote(
          `verdict ${data.result.verdict}` +
            (data.result.credits ? ` · ${data.result.credits} credits` : "")
        );
      }
    } catch {
      setNote(
        `Could not reach ${base}. Start it with: bun run app — the browser runs on your machine, not on this page.`
      );
      setStatus("offline");
    } finally {
      setBusy(false);
    }
  }

  const dot =
    status === "live"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-amber-500"
        : "bg-muted-foreground";

  return (
    <section
      id="run"
      className="border-border bg-frame mt-6 scroll-mt-6 rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">Run a check</h2>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">
            This page talks to the kane-loop server on your machine. Start it
            with <code>bun run app</code>, then point it at any URL and describe
            the check in plain English.
          </p>
        </div>
        <span className="border-border text-muted-foreground inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs">
          <span
            className={`h-1.5 w-1.5 rounded-full ${dot}`}
            aria-hidden="true"
          />
          {status}
        </span>
      </div>

      <form
        onSubmit={run}
        className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"
      >
        <div>
          <label
            htmlFor="target"
            className="text-muted-foreground mb-1.5 block text-xs"
          >
            Target URL
          </label>
          <input
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
            spellCheck={false}
            className="border-border bg-background text-foreground focus:border-foreground w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="check"
            className="text-muted-foreground mb-1.5 block text-xs"
          >
            Check, in plain English
          </label>
          <input
            id="check"
            value={check}
            onChange={(e) => setCheck(e.target.value)}
            required
            spellCheck={false}
            className="border-border bg-background text-foreground focus:border-foreground w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy}
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-progress disabled:opacity-50 lg:w-auto"
          >
            <Play
              className="h-3.5 w-3.5"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            Run Verification
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label
          htmlFor="base"
          className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
        >
          <Radio
            className="h-3.5 w-3.5"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          Server
        </label>
        <input
          id="base"
          value={base}
          onChange={(e) => saveBase(e.target.value)}
          spellCheck={false}
          className="border-border bg-background text-muted-foreground focus:border-foreground w-56 rounded-lg border px-2.5 py-1.5 font-mono text-xs outline-none"
        />
        {note ? (
          <p className="text-muted-foreground font-mono text-xs">{note}</p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="text-muted-foreground font-mono text-xs">
                <th className="pr-4 pb-3 font-medium">#</th>
                <th className="pr-4 pb-3 font-medium">Trigger</th>
                <th className="pr-4 pb-3 font-medium">Check</th>
                <th className="pr-4 pb-3 font-medium">Verdict</th>
                <th className="pb-3 font-medium">Took</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr
                  key={`${it.n}-${it.at}`}
                  className="border-border border-t align-top"
                >
                  <td className="text-muted-foreground py-3 pr-4 font-mono text-sm">
                    {it.n}
                  </td>
                  <td className="text-muted-foreground py-3 pr-4 font-mono text-xs">
                    {it.trigger}
                    {it.triggerFile ? (
                      <span className="block opacity-70">{it.triggerFile}</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-foreground text-sm">{it.result.flow}</p>
                    {it.result.failedStep ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {it.result.failedStep.text} —{" "}
                        {it.result.failedStep.message ?? "assertion failed"}
                      </p>
                    ) : null}
                    {it.patchSummary ? (
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                        {it.agent ?? "agent"} patched ·{" "}
                        {it.patchSummary.slice(0, 90)}
                      </p>
                    ) : null}
                  </td>
                  <td
                    className={`py-3 pr-4 font-mono text-sm font-bold ${verdictTone(it.result.verdict)}`}
                  >
                    {it.result.verdict}
                  </td>
                  <td className="text-muted-foreground py-3 font-mono text-sm">
                    {it.result.durationMs != null
                      ? `${(it.result.durationMs / 1000).toFixed(1)}s`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground border-border mt-6 border-t pt-4 text-sm">
          No live runs yet. Runs appear here the moment your local server
          executes one — whether you start it from this form or the watcher
          fires it on a file save.
        </p>
      )}
    </section>
  );
}
