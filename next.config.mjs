import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` read Cloudflare bindings (Hyperdrive, etc.) locally via
// getCloudflareContext() without needing `wrangler dev` — purely additive,
// does not change local dev when no bindings are configured (lib/db.ts falls
// back to DATABASE_URL either way, see that file's comment).
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A lockfile exists higher up the tree (outside this project); pin the trace
  // root to this app so Next doesn't infer the wrong workspace root.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // 2026-10-12 deviation (CLAUDE.md Section 4, Cloudflare Workers deploy target):
  // keep Prisma's driver-adapter packages and the pg driver out of Next's own
  // bundling — they need to stay as real Node dependencies for the Workers
  // nodejs_compat runtime, per @opennextjs/cloudflare's documented Prisma setup.
  serverExternalPackages: ["@prisma/client", ".prisma/client", "pg"],
};

export default nextConfig;
