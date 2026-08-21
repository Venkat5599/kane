import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";
import { LiveConsole } from "@/components/live-console";

export const metadata: Metadata = createMetadata({
  title: "Loop — kane-loop",
  description: "Live runs and the verify, repair, verify cycle.",
  path: "/dashboard/loop",
});

const steps = [
  {
    n: "1",
    title: "Save a file",
    body: "The watcher debounces for 800ms, then fires Kane against the flow.",
  },
  {
    n: "2",
    title: "Kane fails",
    body: "The failing step, its assertion and the trace are written to .kane-loop/failure.md.",
  },
  {
    n: "3",
    title: "The agent patches",
    body: "Claude, Codex, or any command-line agent reads that brief and edits the source. It is told never to touch the flow files — a test weakened until it passes is worse than no test.",
  },
  {
    n: "4",
    title: "Kane runs again",
    body: "Green, or another attempt. After four it bails loudly and hands back to a human.",
  },
];

export default function Page(): ReactNode {
  return (
    <>
      <header className="border-border border-b px-5 py-4 sm:px-8">
        <h1 className="text-foreground text-[15px] font-semibold">Loop</h1>
      </header>
      <div className="px-5 py-6 sm:px-8">
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Kane verifies, the agent repairs, Kane verifies again. Runs stream in live
          from the kane-loop server running on your machine.
        </p>

        <LiveConsole />

        <section className="border-border bg-frame mt-6 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground text-lg font-semibold">How the loop closes</h2>
          <ol className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2">
            {steps.map((s) => (
              <li key={s.n} className="border-border rounded-xl border p-4">
                <p className="text-muted-foreground font-mono text-xs">{s.n}</p>
                <p className="text-foreground mt-1 text-sm font-medium">{s.title}</p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
