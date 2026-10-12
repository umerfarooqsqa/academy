// Custom Worker entry (CLAUDE.md Section 4 deviation, 2026-10-12 — Cloudflare
// Workers deploy target). OpenNext's generated `.open-next/worker.js` only
// exports a `fetch` handler; Cron Triggers need a `scheduled` handler too, so
// this file re-exports the generated fetch handler and adds one, wired to
// wrangler.jsonc's `triggers.crons`. This replaces Vercel Cron's HTTP ping
// (vercel.json) with the same effect: an HTTP POST to each existing cron
// route, reusing lib/cron/guard.ts's CRON_SECRET check completely unchanged.
//
// `.open-next/worker.js` only exists after `npm run cf:build` — not resolvable
// by tsc before that, hence the ts-ignore.
// @ts-ignore
import openNextHandler from "./.open-next/worker.js";

interface Env {
  HYPERDRIVE: { connectionString: string };
  CRON_SECRET?: string;
}

// Minimal local shape — avoids depending on @cloudflare/workers-types just for
// one method signature this file actually uses.
interface MinimalExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

const FACEBOOK_DIGEST_CRON = "0 15 * * *";
const CHECK_CRON_ROUTES = ["/api/matches/check-notification-delay", "/api/parents/check-neglected"];

export default {
  fetch: openNextHandler.fetch,
  async scheduled(event: { cron: string }, env: Env, ctx: MinimalExecutionContext) {
    const headers: Record<string, string> = {};
    if (env.CRON_SECRET) headers.Authorization = `Bearer ${env.CRON_SECRET}`;

    const paths = event.cron === FACEBOOK_DIGEST_CRON ? ["/api/opportunities/post-facebook-digest"] : CHECK_CRON_ROUTES;
    for (const path of paths) {
      const req = new Request(`https://internal${path}`, { method: "POST", headers });
      ctx.waitUntil(openNextHandler.fetch(req, env, ctx));
    }
  },
};
