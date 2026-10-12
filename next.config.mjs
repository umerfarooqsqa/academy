import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` read Cloudflare bindings (Hyperdrive, etc.) locally via
// getCloudflareContext() without needing `wrangler dev`. Dev-server only —
// verified live that calling this unconditionally also fires during `next
// build` (local and in CI), where it demands a local Postgres connection
// string to emulate Hyperdrive (the exact error this project hit locally
// before this guard was added) even though production builds never need
// local emulation at all. Skipping it outside the dev server avoids that
// entirely; lib/db.ts falls back to DATABASE_URL regardless during build.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

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
  // Marking .prisma/client "external" above stops Next from bundling it, but
  // ALSO stops Next's own file-tracer from copying its runtime files (the
  // generated loader .js/.mjs files and, critically, query_compiler_bg.wasm)
  // into the deployment output — verified live: without this, only
  // schema.prisma made it into .open-next's bundled node_modules, and
  // Cloudflare correctly runs engineType="client" + runtime="workerd"'s
  // import()-based wasm loader if and only if the wasm file actually ships.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**"],
  },
};

export default nextConfig;
