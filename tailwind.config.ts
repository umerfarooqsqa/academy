import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // lib/publicSubjects.ts holds class names for the public site (2026-10-15).
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Public website fonts (2026-10-15 professional redesign): Poppins for
      // headings, Inter for body text. Loaded via next/font/google in
      // app/(public)/layout.tsx, which sets the --font-heading / --font-body
      // CSS variables — no external stylesheet, bundled by Next.js itself.
      fontFamily: {
        heading: ["var(--font-heading)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
