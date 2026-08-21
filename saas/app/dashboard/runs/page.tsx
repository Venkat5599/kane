import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";
import runs from "@/lib/runs.json";
import { RunRow } from "@/components/dashboard-parts";

export const metadata: Metadata = createMetadata({
  title: "Runs — kane-loop",
  description: "Every recorded Kane run, verdict and trace.",
  path: "/dashboard/runs",
});

export default function Page(): ReactNode {
  const lastPass = runs.find((r) => r.verdict === "PASS");
  const lastFail = runs.find((r) => r.verdict === "FAIL");

  return (
    <>
      <header className="border-border border-b px-5 py-4 sm:px-8">
        <h1 className="text-foreground text-[15px] font-semibold">Runs</h1>
      </header>
      <div className="px-5 py-6 sm:px-8">
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Parsed straight from the committed NDJSON in <code>evidence/</code>.
          {lastFail
            ? ` Run ${lastFail.n} is the regression Kane caught during the build.`
            : ""}
        </p>

        <div className="border-border bg-frame mt-6 overflow-x-auto rounded-2xl border p-5 sm:p-6">
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

        <section className="border-border bg-frame mt-6 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground text-lg font-semibold">
            Steps in the last passing run
          </h2>
          <ul className="mt-4 flex list-none flex-col gap-2 p-0">
            {lastPass?.steps.map((s, i) => (
              <li
                key={i}
                className="border-border flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
              >
                <span className="text-foreground text-sm">
                  {i + 1}. {s.text}
                </span>
                <span className="text-muted-foreground shrink-0 font-mono text-xs">
                  {s.ok ? "passed" : "failed"} · {s.seconds}s
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
