import runs from "@/lib/runs.json";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";
import { LiveConsole } from "@/components/live-console";
import {
  LayoutDashboard,
  RefreshCw,
  Activity,
  FolderGit2,
  Users,
  Database,
  FileText,
  Bot,
  MoreHorizontal,
  MoveUpRight,
  MoveDownRight,
  Plus,
} from "lucide-react";

export const metadata: Metadata = createMetadata({
  title: "Dashboard — kane-loop",
  description: "Browser verification runs, verdicts, and evidence.",
  path: "/dashboard",
});

type Run = (typeof runs)[number];

const navHome = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
  { label: "Loop", icon: RefreshCw, href: "#loop", active: false },
  { label: "Runs", icon: Activity, href: "#runs", active: false },
  { label: "Flows", icon: FolderGit2, href: "#flows", active: false },
  { label: "Agents", icon: Users, href: "#agents", active: false },
];

const navEvidence = [
  { label: "Evidence Packs", icon: Database, href: "#evidence" },
  { label: "Traces", icon: FileText, href: "#runs" },
  { label: "Failure Briefs", icon: Bot, href: "#loop" },
];

const lastPass = runs.find((r) => r.verdict === "PASS");
const lastFail = runs.find((r) => r.verdict === "FAIL");

function Delta({ up, children }: { up: boolean; children: ReactNode }): ReactNode {
  const Icon = up ? MoveUpRight : MoveDownRight;
  return (
    <span className="border-border text-foreground/70 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
      {children}
      <Icon className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

function StatCard({
  label,
  value,
  delta,
  deltaUp,
  headline,
  sub,
}: {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  headline: string;
  sub: string;
}): ReactNode {
  const HeadIcon = deltaUp ? MoveUpRight : MoveDownRight;
  return (
    <div className="border-border bg-frame flex flex-col rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm">{label}</p>
        <Delta up={deltaUp}>{delta}</Delta>
      </div>
      <p className="text-foreground mt-3 font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
        {value}
      </p>
      <p className="text-foreground mt-4 flex items-center gap-1.5 text-sm font-medium">
        {headline}
        <HeadIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </p>
      <p className="text-muted-foreground mt-1 text-sm">{sub}</p>
    </div>
  );
}

/** Area chart of real per-step durations from the last passing run. */
function StepChart({ steps }: { steps: Run["steps"] }): ReactNode {
  const W = 900;
  const H = 260;
  const pad = { t: 20, r: 8, b: 28, l: 8 };
  const max = Math.max(...steps.map((s) => s.seconds), 1);
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i: number) =>
    pad.l + (steps.length === 1 ? innerW / 2 : (i * innerW) / (steps.length - 1));
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  const line = steps.map((s, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(s.seconds)}`).join(" ");
  const area = `${line} L ${x(steps.length - 1)} ${pad.t + innerH} L ${x(0)} ${pad.t + innerH} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-64 w-full"
      role="img"
      aria-label={`Duration of each step in the last passing run, ${steps
        .map((s) => `${s.text} ${s.seconds} seconds`)
        .join(", ")}`}
    >
      <defs>
        <linearGradient id="stepFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <g className="text-accent">
        <path d={area} fill="url(#stepFill)" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {steps.map((s, i) => (
          <circle key={i} cx={x(i)} cy={y(s.seconds)} r="4" fill="currentColor" />
        ))}
      </g>
      {steps.map((s, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === steps.length - 1 ? "end" : "middle"}
          className="fill-current text-[13px]"
          style={{ opacity: 0.5 }}
        >
          {s.seconds}s
        </text>
      ))}
    </svg>
  );
}

function RunRow({ run }: { run: Run }): ReactNode {
  const failed = run.steps.filter((s) => !s.ok).length;
  const pass = run.verdict === "PASS";
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
        <span
          className={`font-mono text-sm font-bold tracking-wide ${
            pass ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400"
          }`}
        >
          {run.verdict}
        </span>
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
  const passRate = Math.round((passed / total) * 100);

  return (
    <main id="main-content" className="bg-background min-h-screen">
      <div className="mx-auto flex max-w-[1400px] flex-col lg:flex-row">
        {/* ─── side panel ─────────────────────────────── */}
        <aside className="border-border bg-frame shrink-0 border-b lg:min-h-screen lg:w-64 lg:border-r lg:border-b-0">
          <div className="lg:sticky lg:top-0">
            <a
              href="/"
              className="border-border flex items-center gap-2.5 border-b px-5 py-5"
            >
              <span className="bg-foreground h-5 w-5 rounded-full" aria-hidden="true" />
              <span className="text-foreground text-[15px] font-semibold">kane-loop</span>
            </a>

            <nav className="px-3 py-4" aria-label="Dashboard">
              <p className="text-muted-foreground px-2 pb-2 text-xs">Home</p>
              <ul className="m-0 list-none space-y-0.5 p-0">
                {navHome.map(({ label, icon: Icon, href, active }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
                        active
                          ? "bg-foreground/8 text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>

              <p className="text-muted-foreground px-2 pt-6 pb-2 text-xs">Evidence</p>
              <ul className="m-0 list-none space-y-0.5 p-0">
                {navEvidence.map(({ label, icon: Icon, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors"
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="https://github.com/Venkat5599/kane"
                    className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    Repository
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* ─── main ───────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <header className="border-border flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-8">
            <h1 className="text-foreground text-[15px] font-semibold">Verification</h1>
            <a
              href="https://github.com/Venkat5599/kane#quick-start"
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
              Run a check
            </a>
          </header>

          <div className="px-5 py-6 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Runs recorded"
                value={String(total)}
                delta={`${passRate}%`}
                deltaUp
                headline="Last run green"
                sub="Real browser, real assertions"
              />
              <StatCard
                label="Steps executed"
                value={String(steps)}
                delta={`${passed}/${total}`}
                deltaUp
                headline="Every step traced"
                sub="Evidence packs committed"
              />
              <StatCard
                label="Credits spent"
                value={credits.toFixed(1)}
                delta="~5/step"
                deltaUp={false}
                headline="Replays cost nothing"
                sub="Cached after the first run"
              />
              <StatCard
                label="Loop iterations"
                value="2"
                delta="1 repair"
                deltaUp
                headline="Closed without a human"
                sub="Fail, patch, verify again"
              />
            </div>

            <LiveConsole />

            {/* chart */}
            <section id="loop" className="border-border bg-frame mt-6 scroll-mt-6 rounded-2xl border p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-foreground text-lg font-semibold">Step duration</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Each step of the last passing run, in seconds
                  </p>
                </div>
                <span className="border-border text-muted-foreground rounded-lg border px-3 py-1.5 font-mono text-xs">
                  session {lastPass?.sessionId?.slice(0, 8) ?? "—"}
                </span>
              </div>
              <div className="mt-6">
                {lastPass ? <StepChart steps={lastPass.steps} /> : null}
              </div>
              <ol className="border-border mt-4 grid list-none gap-2 border-t p-0 pt-4 sm:grid-cols-2">
                {lastPass?.steps.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-foreground truncate text-sm">
                      {i + 1}. {s.text}
                    </span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      {s.seconds}s
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {/* runs table */}
            <section id="runs" className="border-border bg-frame mt-6 scroll-mt-6 rounded-2xl border p-5 sm:p-6">
              <h2 className="text-foreground text-lg font-semibold">Runs</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Parsed from the committed NDJSON in <code>evidence/</code>.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="text-muted-foreground font-mono text-xs">
                      <th className="pr-4 pb-3 font-medium">#</th>
                      <th className="pr-4 pb-3 font-medium">Flow</th>
                      <th className="pr-4 pb-3 font-medium">Verdict</th>
                      <th className="pr-4 pb-3 font-medium">Took</th>
                      <th className="pr-4 pb-3 font-medium">Credits</th>
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
              {lastFail ? (
                <p className="text-muted-foreground mt-4 text-sm">
                  Run {lastFail.n} is the regression Kane caught during the build — the
                  failing step is what the coding agent was handed to fix.
                </p>
              ) : null}
            </section>

            {/* evidence / run it yourself */}
            <section
              id="evidence"
              className="border-border bg-frame mt-6 scroll-mt-6 rounded-2xl border p-5 sm:p-6"
            >
              <h2 className="text-foreground text-lg font-semibold">Run one yourself</h2>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                Live runs drive a real Chrome on your own machine, so they happen in the
                local console rather than on this page. Clone the repo and the same table
                streams in real time.
              </p>
              <pre className="border-border bg-background mt-4 overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed">
                <code>{`git clone https://github.com/Venkat5599/kane
cd kane && bun install
bun run app     # console on :3000
bun run loop    # watcher + Kane + your agent`}</code>
              </pre>
            </section>

            <section id="flows" className="sr-only" aria-hidden="true" />
            <section id="agents" className="sr-only" aria-hidden="true" />
          </div>
        </div>
      </div>
    </main>
  );
}
