// Required config file for @opennextjs/cloudflare (CLAUDE.md Section 4
// deviation, 2026-10-12 — Cloudflare Workers deploy target). No incremental
// cache override: every page in this app is `export const dynamic =
// "force-dynamic"` (an internal admin dashboard, no ISR), so the default
// in-memory cache is sufficient — not adding the R2 incremental-cache binding
// from the package's template since nothing here would ever use it.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
