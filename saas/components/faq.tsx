"use client";

import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

const faqs = [
  {
    question: "Do I need to know Playwright or Selenium?",
    answer:
      'No. You describe the check the way you\'d describe it to a colleague — "click Run Verification and assert a result row appears" — and Kane drives a real Chrome to do it. No selectors, no page objects, no framework to set up.',
  },
  {
    question: "Which coding agent does it work with?",
    answer:
      "Any of them. Claude Code and Codex ship as built-in adapters, and KANE_LOOP_AGENT_CMD wires in anything else that takes a prompt on the command line. The loop only cares that something reads the failure and edits the code.",
  },
  {
    question: "What does the closed loop actually do?",
    answer:
      "A watcher fires Kane on every save. On a failure it writes a brief — the failing step, the assertion, the trace — and hands it to your agent. The agent patches the source, the save re-triggers the watcher, and Kane verifies again. It stops when the run goes green or after four attempts.",
  },
  {
    question: "Can it edit the test to make it pass?",
    answer:
      "No, and that's deliberate. The agent's brief explicitly tells it to change application source only and leave the flow files alone. A test weakened until it passes is worse than no test at all.",
  },
  {
    question: "What does it cost to run?",
    answer:
      "kane-loop is free and MIT licensed. The browser runs are billed as Kane credits — roughly 5 per step, so a four-step check costs about 20. Every new TestMu AI account starts with free credits, and reruns replay from cache.",
  },
];

const ease = [0.23, 1, 0.32, 1] as const;

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease, delay: index * 0.05 }}
      onClick={onToggle}
      className="bg-frame cursor-pointer rounded-2xl p-5 shadow-sm sm:p-6"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={isOpen}
    >
      <div className="flex w-full items-center justify-between gap-4 text-left">
        <span className="text-foreground text-base font-medium sm:text-lg">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease }}
          className="shrink-0"
        >
          <ChevronDown className="text-muted-foreground h-5 w-5" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="text-muted-foreground pt-4 text-sm leading-relaxed sm:text-base">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ(): ReactNode {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center sm:mb-16"
        >
          <span className="text-muted-foreground text-sm font-medium">
            Frequently Asked Questions
          </span>
          <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need to know
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base sm:text-lg">
            Still stuck? Open an issue on GitHub.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <motion.a
              href="https://github.com/Venkat5599/kane"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              View on GitHub
            </motion.a>
            <motion.a
              href="https://github.com/Venkat5599/kane/issues"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border-border bg-frame text-foreground inline-flex items-center rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              Open an issue
            </motion.a>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3" role="list">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
