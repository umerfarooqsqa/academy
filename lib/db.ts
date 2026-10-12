import type { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// 2026-10-12 deviation (see CLAUDE.md Section 4): deploy target moved from
// Vercel to Cloudflare Workers, which can't open a raw TCP connection to
// Postgres — Cloudflare Hyperdrive bridges that, exposed to the Worker as a
// binding (env.HYPERDRIVE.connectionString), only reachable from inside a
// request via getCloudflareContext(). Prisma's query engine is replaced
// entirely by a driver adapter (@prisma/adapter-pg + pg) so the same
// adapter-based client works both ways — only the connection-string source
// differs. getCloudflareContext() throws outside a real Worker request (local
// `next dev`, vitest, the embedded test Postgres), which is exactly how we
// detect "not on Cloudflare" and fall back to plain DATABASE_URL.
//
// Which @prisma/client ENTRY POINT to import also has to differ per
// environment, verified the hard way through two separate failures:
// - The default "@prisma/client" entry (index.js) loads the query-compiler
//   wasm via a plain Node fs read — works fine locally, but fails on
//   Cloudflare ("no such file or directory, readAll '.../query_compiler_bg.wasm'")
//   because webpack resolves that require() using Node conditions at `next
//   build` time, long before wrangler's own esbuild pass for the Workers
//   target ever runs — the generator's `runtime = "workerd"` setting doesn't
//   help here since this specific require() never gets a chance to resolve
//   under "workerd" conditions at all.
// - The explicit "@prisma/client/wasm" entry sidesteps that by always using
//   the import()-based wasm-worker-loader (even as its own "default"
//   fallback) — this is what Cloudflare needs — but a native `import()` of a
//   .wasm file is still an experimental, unreliable feature in plain Node.js,
//   so this entry breaks local dev ("the loaded wasm module was unexpectedly
//   undefined or null once loaded").
//
// The entry itself is chosen dynamically via a top-level await (supported in
// Next.js's server runtime). This can't reuse the getCloudflareContext()
// try/catch below as the "which environment" signal: that succeeds in BOTH
// real production AND local `next dev` (on purpose — next.config.mjs's
// initOpenNextCloudflareForDev() deliberately makes it succeed locally too,
// to emulate the Hyperdrive binding for convenience). Verified live: using
// that as the "which entry" signal made local dev try to load the wasm entry
// and hit the same "undefined once loaded" failure as importing
// "@prisma/client/wasm" unconditionally. `navigator.userAgent ===
// "Cloudflare-Workers"` is the real, Cloudflare-documented way to detect the
// actual Workers runtime specifically (never true in emulated local dev).
function isRealWorkersRuntime(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

async function loadPrismaClient() {
  if (isRealWorkersRuntime()) {
    const { PrismaClient } = await import("@prisma/client/wasm");
    return PrismaClient;
  }
  const { PrismaClient } = await import("@prisma/client");
  return PrismaClient;
}

function resolveConnectionString(): string {
  try {
    const { env } = getCloudflareContext();
    const hyperdrive = (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE;
    if (hyperdrive?.connectionString) return hyperdrive.connectionString;
  } catch {
    // Not running inside a Cloudflare Worker (real or emulated) — fall
    // through to DATABASE_URL.
  }
  return process.env.DATABASE_URL ?? "";
}

// Resolved once per isolate (cheap — just picks which constructor to use).
const PrismaClientCtor = await loadPrismaClient();

function freshClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: resolveConnectionString() });
  return new PrismaClientCtor({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }) as PrismaClient;
}

// Local dev/test: one shared client for the process's lifetime, same as any
// normal Node server — avoids exhausting Supabase's free-tier connection pool
// across Next.js dev hot-reloads.
//
// Real Cloudflare Workers: a FRESH client (and its own pg Pool/connection) is
// built on every top-level `prisma.<model>` access instead, via the Proxy
// below. This is not a style choice — verified live the hard way: a Prisma
// client cached across requests in one Worker isolate (the same pattern used
// locally) works for exactly one request, then every subsequent request on
// that isolate hangs until Cloudflare force-kills it ("the Workers runtime
// canceled this request because it detected that your Worker's code had
// hung"). This matches Cloudflare's own documented Hyperdrive guidance: don't
// share one client across requests in a Worker. Hyperdrive is specifically
// built to make this cheap (it absorbs the real upstream connection pooling),
// so creating a new one per top-level call is the intended usage, not waste.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = isRealWorkersRuntime()
  ? (new Proxy(
      {},
      {
        get(_target, prop, receiver) {
          return Reflect.get(freshClient() as object, prop, receiver);
        },
      },
    ) as PrismaClient)
  : (globalForPrisma.prisma ?? freshClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * For `$transaction([...])` call sites only. The Proxy above gives every
 * top-level `prisma.<model>` access its own fresh client on Cloudflare, which
 * is correct for independent queries but breaks `$transaction`: Prisma
 * requires every operation batched into one `$transaction` call to come from
 * the SAME client instance, and the array passed to `$transaction` is built
 * (so each operation already exists) before `$transaction` itself ever runs.
 * Build that array against the client this returns instead of the plain
 * `prisma` export — see lib/matching/run.ts and lib/parents/actions.ts for
 * the two places this matters.
 */
export function transactionClient(): PrismaClient {
  return isRealWorkersRuntime() ? freshClient() : prisma;
}
