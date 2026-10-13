import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Playful display font for the public website's headings (2026-10-13
      // redesign — operator feedback: make it look distinct, not corporate).
      // Loaded via next/font/google in app/(public)/layout.tsx, which sets
      // the --font-heading CSS variable — no external stylesheet, no new
      // dependency, bundled by Next.js itself.
      fontFamily: {
        heading: ["var(--font-heading)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
