import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";
import runs from "@/lib/runs.json";
import { StatCard, StepChart } from "@/components/dashboard-parts";

export const metadata: Metadata = createMetadata({
  title: "Overview",
  description: "Verification overview: runs, steps, credits.",
  path: "/dashboard",
});

export default function Page(): ReactNode {
  const total = runs.length;
  const passed = runs.filter((r) => r.verdict === "PASS").length;
  const steps = runs.reduce((t, r) => t + r.steps.length, 0);
  const credits = runs.reduce((t, r) => t + r.credits, 0);
  // Computed here, not imported: values exported from a "use client" module
  // arrive in a server component as client references, not data.
  const lastPass = runs.find((r) => r.verdict === "PASS");

  return (
    <>
      <header className="border-border border-b px-5 py-4 sm:px-8">
        <h1 className="text-foreground text-[15px] font-semibold">Overview</h1>
      </header>
      <div className="px-5 py-6 sm:px-8">
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Every number here came out of a real Kane run against a real browser. The
          NDJSON and evidence packs are committed in the repo.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Runs recorded"
            value={String(total)}
            delta={`${Math.round((passed / total) * 100)}%`}
            deltaUp
            headline="Last run green"
            sub="Real browser, real assertions"
          />
          <StatCard
            label="Steps executed"
            value={String(steps)}
            delta="traced"
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
            label="Repair attempts"
            value="4"
            delta="max"
            deltaUp
            headline="Cap before it bails"
            sub="Fail, agent patches, verify again"
          />
        </div>

        <section className="border-border bg-frame mt-6 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground text-lg font-semibold">Step duration</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Each step of the last passing run, in seconds
          </p>
          <div className="mt-6">
            {lastPass ? <StepChart steps={lastPass.steps} /> : null}
          </div>
        </section>
      </div>
    </>
  );
}
