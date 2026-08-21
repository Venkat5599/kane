"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

const plans = [
  {
    name: "One step",
    price: 5,
    monthlyPrice: 5,
    description: "A single plain-English assertion",
    features: [
      "Real Chrome",
      "Pass or fail",
      "Step trace",
      "Replays cached free",
    ],
    popular: false,
  },
  {
    name: "One flow",
    price: 20,
    monthlyPrice: 20,
    description: "A four-step check, start to finish",
    features: [
      "Multi-step flow",
      "Evidence pack",
      "Playwright export",
      "Replays cached free",
    ],
    popular: true,
  },
  {
    name: "One closed loop",
    price: 40,
    monthlyPrice: 40,
    description: "Fail, agent patches, verify again",
    features: [
      "Failure brief",
      "Agent repair",
      "Automatic re-verify",
      "Iteration cap",
    ],
    popular: false,
  },
];

const ease = [0.23, 1, 0.32, 1] as const;

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof plans)[0];
  index: number;
}): ReactNode {
  const isPopular = plan.popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease, delay: index * 0.1 }}
      className="relative"
    >
      {isPopular && (
        <div
          className="bg-accent absolute -inset-1 rounded-[1.2em]"
          aria-hidden="true"
        />
      )}

      <div
        className={`bg-frame relative flex h-full flex-col rounded-2xl p-6 sm:p-8 ${
          isPopular ? "" : "border-border border"
        }`}
      >
        {isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-accent inline-block rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide text-black/50 uppercase">
              Most Popular
            </span>
          </div>
        )}

        <h3 className="text-foreground text-xl font-semibold">{plan.name}</h3>

        <div className="mt-4">
          <div className="flex items-end gap-3">
            <span className="text-foreground text-5xl font-bold tracking-tight">
              ~{plan.price}
            </span>
            <span className="text-muted-foreground mb-1 text-sm">credits</span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Billed by Kane, not by us. kane-loop is free and MIT licensed.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
            isPopular
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "bg-muted text-foreground hover:bg-muted/80"
          }`}
        >
          View on GitHub
        </motion.button>

        <div className="mt-8">
          <p className="text-muted-foreground text-sm font-medium">Includes:</p>
          <ul className="mt-4 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check
                  className="text-foreground h-4 w-4 shrink-0"
                  strokeWidth={2.5}
                />
                <span className="text-foreground text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing(): ReactNode {
  return (
    <section
      id="pricing"
      className="bg-background w-full scroll-mt-24 px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center sm:mb-16"
        >
          <span className="text-muted-foreground text-sm font-medium">
            Pricing
          </span>
          <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Runs on your Kane credits
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base sm:text-lg">
            kane-loop itself is free and open source. Browser runs are billed by
            Kane, and every new TestMu AI account starts with free credits.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
