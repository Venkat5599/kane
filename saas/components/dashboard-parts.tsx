"use client";

import runs from "@/lib/runs.json";
import type { ReactNode } from "react";
import { MoveUpRight, MoveDownRight } from "lucide-react";

type Run = (typeof runs)[number];


export function Delta({
  up,
  children,
}: {
  up: boolean;
  children: ReactNode;
}): ReactNode {
  const Icon = up ? MoveUpRight : MoveDownRight;
  return (
    <span className="border-border text-foreground/70 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
      {children}
      <Icon className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

export function StatCard({
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
export function StepChart({ steps }: { steps: Run["steps"] }): ReactNode {
  const W = 900;
  const H = 260;
  const pad = { t: 20, r: 8, b: 28, l: 8 };
  const max = Math.max(...steps.map((s) => s.seconds), 1);
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i: number) =>
    pad.l +
    (steps.length === 1 ? innerW / 2 : (i * innerW) / (steps.length - 1));
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  const line = steps
    .map((s, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(s.seconds)}`)
    .join(" ");
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
          <circle
            key={i}
            cx={x(i)}
            cy={y(s.seconds)}
            r="4"
            fill="currentColor"
          />
        ))}
      </g>
      {steps.map((s, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          textAnchor={
            i === 0 ? "start" : i === steps.length - 1 ? "end" : "middle"
          }
          className="fill-current text-[13px]"
          style={{ opacity: 0.5 }}
        >
          {s.seconds}s
        </text>
      ))}
    </svg>
  );
}

export function RunRow({ run }: { run: Run }): ReactNode {
  const failed = run.steps.filter((s) => !s.ok).length;
  const pass = run.verdict === "PASS";
  return (
    <tr className="border-border border-t align-top">
      <td className="text-muted-foreground py-4 pr-4 font-mono text-sm">
        {run.n}
      </td>
      <td className="py-4 pr-4">
        <p className="text-foreground text-sm">{run.flow}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {run.steps.length} steps{failed > 0 ? `, ${failed} failed` : ""}
        </p>
      </td>
      <td className="py-4 pr-4">
        <span
          className={`font-mono text-sm font-bold tracking-wide ${
            pass
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-orange-700 dark:text-orange-400"
          }`}
        >
          {run.verdict}
        </span>
      </td>
      <td className="text-muted-foreground py-4 pr-4 font-mono text-sm">
        {run.seconds}s
      </td>
      <td className="text-muted-foreground py-4 pr-4 font-mono text-sm">
        {run.credits}
      </td>
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

