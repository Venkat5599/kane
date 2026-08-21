"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { CalendarCheck, Users, Rocket } from "lucide-react";
import type { ReactNode } from "react";

const steps = [
  {
    icon: CalendarCheck,
    title: "Describe the check",
    description:
      "Point it at a URL and say what should happen, in plain English. No selectors, no page objects, no suite to maintain.",
  },
  {
    icon: Users,
    title: "A real browser runs it",
    description:
      "Kane opens Chrome and does it for real — clicks, types, asserts — then returns pass or fail with a step-by-step trace.",
  },
  {
    icon: Rocket,
    title: "The agent fixes what broke",
    description:
      "On a failure the loop hands the failing step to your coding agent, which patches the source. Kane runs again. Nobody sits in the middle.",
  },
];

function StepItem({
  step,
  isLast,
}: {
  step: (typeof steps)[0];
  isLast: boolean;
}): ReactNode {
  const Icon = step.icon;

  return (
    <div className={`relative flex gap-5 ${isLast ? "" : "pb-64"}`}>
      <div
        className="bg-accent relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5 text-black" strokeWidth={2} />
      </div>

      <div className="pt-1">
        <h3 className="text-foreground text-xl font-semibold sm:text-2xl">
          {step.title}
        </h3>
        <p className="text-foreground/60 mt-2 max-w-sm text-base leading-relaxed">
          {step.description}
        </p>
      </div>
    </div>
  );
}

export function HowItWorks(): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.3", "end 0.7"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="bg-background relative w-full">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-48 lg:h-fit lg:self-start">
          <h2 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            How it works
          </h2>
          <p className="text-foreground/60 mt-6 max-w-md text-lg leading-relaxed">
            A watcher, a real browser, and your{" "}
            <span className="text-foreground font-medium">coding agent</span>.
            No selectors, no framework, no suite to maintain.
          </p>
          <motion.a
            href="https://github.com/Venkat5599/kane#readme"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-foreground text-background hover:bg-foreground/90 mt-8 inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
          >
            Read the docs
          </motion.a>
        </div>

        <div className="relative">
          <div
            className="bg-foreground/10 absolute top-6 left-6 h-[calc(100%-6rem)] w-0.5 -translate-x-1/2"
            aria-hidden="true"
          >
            <motion.div
              style={{ height: lineHeight, willChange: "height" }}
              className="bg-accent w-full"
            />
          </div>

          <ol className="relative m-0 list-none p-0">
            {steps.map((step, index) => (
              <li key={step.title}>
                <StepItem step={step} isLast={index === steps.length - 1} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
