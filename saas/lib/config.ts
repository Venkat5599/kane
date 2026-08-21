/**
 * ============================================================================
 * SITE CONFIGURATION
 * ============================================================================
 *
 * All text, links, and settings are centralized here for easy editing.
 */

export const siteConfig = {
  // Brand
  name: "kane-loop",
  tagline: "Your agent writes it. Kane checks it.",
  description:
    "Point it at any URL, describe the check in plain English, get a real browser verdict — and let your coding agent fix what fails.",

  // URLs
  url: "https://kane-loop.vercel.app",
  twitter: "@kaneloop",

  // Navigation
  nav: {
    cta: {
      text: "Run a check",
      href: "#run",
    },
    signIn: {
      text: "View on GitHub",
      href: "https://github.com/Venkat5599/kane",
    },
  },
};

export const heroConfig = {
  badge: "Built on Kane CLI",
  headline: {
    line1: "Your agent writes it.",
    line2: "Kane",
    accent: "checks it.",
  },
  subheadline:
    "Describe a check in plain English. A real browser runs it and returns pass or fail. When it fails, your coding agent reads the failure and fixes it — then Kane runs again.",
  cta: {
    text: "Run a check",
    href: "#run",
  },
};

export const blurHeadlineConfig = {
  text: "AI agents ship code faster than anyone can check it. The loop stays open because someone still has to open a browser and click through. kane-loop closes it: Kane becomes the agent's eyes, the agent becomes Kane's hands, and nobody has to sit in the middle.",
};

export const testimonialsConfig = {
  title: "Trusted by teams worldwide",
  autoplayInterval: 10000, // milliseconds
};

export const howItWorksConfig = {
  title: "How it works",
  description:
    "A watcher, a real browser, and your coding agent. No selectors, no framework, no test suite to maintain.",
  cta: {
    text: "Read the docs",
    href: "https://github.com/Venkat5599/kane#readme",
  },
};

export const pricingConfig = {
  title: "Runs on your Kane credits",
  description:
    "kane-loop itself is free and open source. Browser runs are billed by Kane, and every new TestMu AI account starts with free credits.",
  billingNote: "Kane credits, roughly 5 per step",
};

export const faqConfig = {
  title: "Everything you need to know",
  description: "Still stuck? Open an issue on GitHub.",
  cta: {
    primary: {
      text: "Run a check",
      href: "#run",
    },
    secondary: {
      text: "Open an issue",
      href: "https://github.com/Venkat5599/kane/issues",
    },
  },
};

export const footerConfig = {
  cta: {
    headline: "Stop clicking through your own app to see if the agent broke it",
    placeholder: "https://your-site.com",
    button: "Run a check",
  },
  copyright: `© ${new Date().getFullYear()} kane-loop. MIT licensed.`,
};

/**
 * ============================================================================
 * FEATURE FLAGS
 * ============================================================================
 *
 * Toggle features on/off without touching component code.
 */

export const features = {
  smoothScroll: true,
  testimonialAutoplay: true,
  parallaxHero: true,
  blurInHeadline: true,
};

/**
 * ============================================================================
 * THEME CONFIGURATION
 * ============================================================================
 *
 * Colors are defined in globals.css using CSS custom properties.
 * This config controls which theme features are enabled.
 */

export const themeConfig = {
  defaultTheme: "system" as "light" | "dark" | "system",
  enableSystemTheme: true,
};
