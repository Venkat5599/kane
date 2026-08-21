import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";
import runs from "@/lib/runs.json";

export const metadata: Metadata = createMetadata({
  title: "Evidence — kane-loop",
  description: "Evidence packs and traces for every run.",
  path: "/dashboard/evidence",
});

const SETUP = `git clone https://github.com/Venkat5599/kane
cd kane && bun install
bun run app     # console on :3000
bun run loop    # watcher + Kane + your agent`;

export default function Page(): ReactNode {
  return (
    <>
      <header className="border-border border-b px-5 py-4 sm:px-8">
        <h1 className="text-foreground text-[15px] font-semibold">Evidence</h1>
      </header>
      <div className="px-5 py-6 sm:px-8">
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Kane seals an evidence pack for every run. Passing runs stay local; a failed
          run uploads a hosted trace you can open.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {runs.map((run) => (
            <div key={run.n} className="border-border bg-frame rounded-2xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-foreground text-sm font-medium">
                  Run {run.n} · {run.flow}
                </p>
                <span
                  className={`font-mono text-xs font-bold ${
                    run.verdict === "PASS"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-orange-700 dark:text-orange-400"
                  }`}
                >
                  {run.verdict}
                </span>
              </div>
              <p className="text-muted-foreground mt-2 font-mono text-xs">
                session {run.sessionId ? run.sessionId.slice(0, 8) : "—"} · {run.seconds}s
                · {run.credits} credits
              </p>
              {run.shareUrl ? (
                <a
                  className="text-foreground mt-3 inline-block text-sm underline underline-offset-4"
                  href={run.shareUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Open hosted trace
                </a>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm">
                  Local pack — <code>kane-cli evidence serve</code>
                </p>
              )}
            </div>
          ))}
        </div>

        <section className="border-border bg-frame mt-6 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground text-lg font-semibold">Run it yourself</h2>
          <pre className="border-border bg-background mt-4 overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed">
            <code>{SETUP}</code>
          </pre>
        </section>
      </div>
    </>
  );
}
