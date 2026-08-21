import runs from "@/lib/runs.json";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Dashboard — kane-loop",
  description: "Browser verification runs, verdicts, and evidence.",
  path: "/dashboard",
});

type Run = (typeof runs)[number];

const nav = [
  { label: "Overview", href: "/dashboard", active: true },
  { label: "Runs", href: "/dashboard#runs", active: false },
  { label: "Evidence", href: "/dashboard#evidence", active: false },
  { label: "Flows", href: "/dashboard#flows", active: false },
];

function Stat({ label, value, note }: { label: string; value: string; note?: string }): ReactNode {
  return (
    <div className="border-border bg-frame rounded-2xl border p-5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-foreground mt-2 font-mono text-3xl font-semibold tracking-tight">
        {value}
      </p>
      {note ? <p className="text-muted-foreground mt-1 text-xs">{note}</p> : null}
    </div>
  );
}

function VerdictTag({ verdict }: { verdict: string }): ReactNode {
  const tone =
    verdict === "PASS"
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-orange-700 dark:text-orange-400";
  return <span className={`font-mono text-sm font-bold tracking-wide ${tone}`}>{verdict}</span>;
}

function RunRow({ run }: { run: Run }): ReactNode {
  const failed = run.steps.filter((s) => !s.ok).length;
  return (
    <tr className="border-border border-t align-top">
      <td className="text-muted-foreground py-4 pr-4 font-mono text-sm">{run.n}</td>
      <td className="py-4 pr-4">
        <p className="text-foreground text-sm">{run.flow}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {run.steps.length} steps{failed > 0 ? `, ${failed} failed` : ""}
        </p>
      </td>
      <td className="py-4 pr-4">
        <VerdictTag verdict={run.verdict} />
      </td>
      <td className="text-muted-foreground py-4 pr-4 font-mono text-sm">{run.seconds}s</td>
      <td className="text-muted-foreground py-4 pr-4 font-mono text-sm">{run.credits}</td>
      <td className="py-4 text-sm">
        {run.shareUrl ? (
          <a
            className="text-foreground underline underline-offset-4"
            href={run.shareUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            trace
          </a>
        ) : (
          <span className="text-muted-foreground font-mono text-xs">
            {run.sessionId ? run.sessionId.slice(0, 8) : "—"}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function DashboardPage(): ReactNode {
  const total = runs.length;
  const passed = runs.filter((r) => r.verdict === "PASS").length;
  const credits = runs.reduce((t, r) => t + r.credits, 0);
  const steps = runs.reduce((t, r) => t + r.steps.length, 0);

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row lg:gap-12">
        {/* side panel */}
        <aside className="lg:w-56 lg:shrink-0">
          <div className="lg:sticky lg:top-24">
            <a href="/" className="text-foreground text-lg font-semibold">
              kane-loop
            </a>
            <p className="text-muted-foreground mt-1 text-xs">verification dashboard</p>
            <nav className="mt-6 flex gap-2 lg:flex-col" aria-label="Dashboard sections">
              {nav.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    item.active
                      ? "bg-frame text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="border-border mt-6 hidden border-t pt-6 lg:block">
              <p className="text-muted-foreground text-xs leading-relaxed">
                These are real runs recorded by <code>kane-cli testmd run</code>. Live
                runs happen in the local console at <code>localhost:3000</code>.
              </p>
            </div>
          </div>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Overview
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base">
            Every row below came out of a real Kane run against a real browser. The
            NDJSON and evidence packs are committed in the repo.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Runs" value={String(total)} />
            <Stat label="Passed" value={`${passed}/${total}`} note="last run green" />
            <Stat label="Steps executed" value={String(steps)} />
            <Stat label="Credits spent" value={credits.toFixed(1)} note="~5 per step" />
          </div>

          <section id="runs" className="mt-12 scroll-mt-24">
            <h2 className="text-foreground text-xl font-semibold">Runs</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="text-muted-foreground font-mono text-xs">
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 pr-4 font-medium">Flow</th>
                    <th className="pb-3 pr-4 font-medium">Verdict</th>
                    <th className="pb-3 pr-4 font-medium">Took</th>
                    <th className="pb-3 pr-4 font-medium">Credits</th>
                    <th className="pb-3 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <RunRow key={run.n} run={run} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="flows" className="mt-12 scroll-mt-24">
            <h2 className="text-foreground text-xl font-semibold">Steps in the last run</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {runs
                .filter((r) => r.verdict === "PASS")
                .slice(0, 1)
                .flatMap((r) => r.steps)
                .map((step, i) => (
                  <li
                    key={i}
                    className="border-border bg-frame flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
                  >
                    <span className="text-foreground text-sm">{step.text}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      {step.ok ? "passed" : "failed"} · {step.seconds}s
                    </span>
                  </li>
                ))}
            </ul>
          </section>

          <section id="evidence" className="mt-12 scroll-mt-24">
            <h2 className="text-foreground text-xl font-semibold">Run one yourself</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
              Live runs drive a real Chrome on your machine, so they happen in the local
              console rather than here. Clone the repo, start it, and the same table
              streams in real time.
            </p>
            <pre className="border-border bg-frame mt-4 overflow-x-auto rounded-2xl border p-4 font-mono text-xs leading-relaxed">
              <code>{`git clone https://github.com/Venkat5599/kane
cd kane && bun install
bun run app     # console on :3000
bun run loop    # watcher + Kane + your agent`}</code>
            </pre>
          </section>
        </div>
      </div>
    </main>
  );
}
