import { PrismaClient } from "@prisma/client";
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
// detect "not on Cloudflare" and fall back to plain DATABASE_URL — no local
// dev or test behavior changes.
function resolveConnectionString(): string {
  try {
    const { env } = getCloudflareContext();
    const hyperdrive = (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE;
    if (hyperdrive?.connectionString) return hyperdrive.connectionString;
  } catch {
    // Not running inside a Cloudflare Worker — fall through to DATABASE_URL.
  }
  return process.env.DATABASE_URL ?? "";
}

// Single shared Prisma client (avoids exhausting the Supabase free-tier connection
// pool during Next.js dev hot-reloads, and built once per Worker isolate in prod).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: resolveConnectionString() });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
