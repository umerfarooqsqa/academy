# Tutor-Parent Matching Platform — Build Specification

This file is the single source of truth for building this system. Read it fully before writing any code. Every architectural decision below is final and deliberate — do not deviate, do not introduce additional tools, services, or abstractions not listed here.

## Quick reference (constants — full context and rationale are in the linked sections)

| Constant | Value | Section |
|---|---|---|
| LLM model | `openai/gpt-oss-20b` via Groq (primary), Gemini free tier fallback — **deviation, 2026-10-12**: Groq discontinued the originally-specified `llama-3.3-70b-versatile` entirely (confirmed live via GET /openai/v1/models, 404 model_not_found); this is the closest current free-tier equivalent with JSON-mode support. Overridable via `GROQ_MODEL` env var. | 6.2 |
| Matching weights | budget=0.2, rating=0.25, distance=0.15, availability=0.15, grade=0.25 | 6.3 |
| Commission | 50% (first month only — confirm before building payout logic) | 6.7, 9 |
| Payment provider (parents) | JazzCash, automated webhook | 4, 6.7 |
| Tutor subscription payment | Manual, operator-entered — no gateway | 6.5 |
| Premium notification delay | 60 min before publishing to /opportunities (`PREMIUM_NOTIFICATION_DELAY_MINUTES`) — premium tutors get instant private WhatsApp ping, free tutors get the public page instead, never a paid push (6.5) | 6.5, 9 |
| Rating request delay | 30 days after payment collected, automatic (`RATING_REQUEST_DELAY_DAYS`) | 6.8, 9 |
| Free opportunity distribution | Public `/opportunities` page + daily Facebook Page digest (auto) + manual copy-paste for WhatsApp groups. No Groups API, no Instagram automation, no Status | 6.5, 12 |
| WhatsApp pricing risk | Meta ends free service-window replies Oct 1, 2026 — the highest-volume flow (intake conversations) stops being free. Route parent ads via Click-to-WhatsApp for the 72h Free Entry Point window, which stays free past Oct 1 | 1 |
| In-scope subjects | O/A-levels, FSc/Intermediate (pre-medical, pre-engineering), Computer Science, Skills, University-level | 1, 6.1 |
| Excluded | Matric/SSC (grade 9-10) | 1, 6.1 |
| Hard filters (matching) | subject overlap, subjectGroup match, area (unless online) | 6.3 |
| Neutral-default score | 0.5, for any missing scoring input | 6.3 |
| Deploy | Single Next.js app, Cloudflare Workers (via `@opennextjs/cloudflare`), Supabase Postgres (via Cloudflare Hyperdrive) — **deviation, 2026-10-12**: replaces the original Vercel plan, operator's explicit choice. See Section 4. | 4 |

## 1. Business context

This is a tutor-parent matching agency ("academy"). The business runs ads to acquire both tutors and parents. Tutors register their teaching background (qualifications, subjects, curriculum e.g. O-levels/A-levels/Matric, service area). Parents submit their requirement (subject, level, curriculum, area, budget). The system matches them, the parent picks a tutor from the offered options, a demo is scheduled, the parent pays first, the platform takes a commission, and the remainder goes to the tutor.

**Critical past failure to prevent**: a tutor from one area (e.g. North Nazimabad) was once matched with a parent in a distant area (e.g. Malir) — commute made the match unusable. Area/zone matching must be a hard, non-negotiable filter, never a soft preference an LLM could reason past.

**Operator constraints**: solo operator, near-zero budget, limited time (weekends + weekday evenings after ~7-8pm). Every design decision below optimizes for lowest cost and lowest maintenance burden, not maximum sophistication.

**Prerequisite — not yet done**: the operator has no Meta Business / WhatsApp Cloud API setup yet. This must be completed (Meta Business verification, WhatsApp Cloud API number, webhook URL registration) before Phase 1 can be tested end-to-end. This is an operator task, not a coding task — Claude Code should flag if it's blocked by this and can scaffold the webhook code against Meta's documented contract in the meantime, but cannot verify it live until the setup exists. **This does not block development or testing** — Meta issues a free test phone number and up to 5 whitelisted test recipients the moment a developer app is created, with no Business verification required; only the eventual public/production number needs it.

**WhatsApp messaging cost — the "$0 infra" assumption has a real caveat.** Today, free-form replies inside the 24-hour customer service window are free. From October 1, 2026, Meta starts charging for those replies at the same per-message rate as utility/authentication templates — this hits the highest-volume flow in the whole system (ordinary intake conversations, 6.1-6.3), not just the already-paid business-initiated messages (tutor notifications, rating requests). Two mitigations, both already reflected in the relevant sections: (1) route parent ad traffic through Click-to-WhatsApp ads specifically, which opens a 72-hour Free Entry Point window that stays free past October; (2) the tutor-notification and rating-request costs are the justified, funded ones (subscription revenue, forecastable per-deal cost) — see 6.5 and 6.8. Once October's actual per-message rate for Pakistan is published (check close to the date), add a WhatsApp messaging line item to the `/finance` cost-per-deal calculator (6.9) — this is a real, if small, operating cost now, not a placeholder $0.

**Subject scope — expanded from the original O/A-levels-only plan, Matric still excluded.** The platform now covers multiple subject groups: O-levels/A-levels (Cambridge/British curriculum), FSc/Intermediate pre-medical and pre-engineering groups, Computer Science, vocational/skills subjects, and university-level tutoring. **Matric (grade 9-10 board curriculum) remains explicitly excluded** — this was the specific low-budget segment identified as unprofitable (see the original note above), and FSc/Intermediate is a different, higher academic tier than Matric — the same tier as A-levels — so including it does not reverse that exclusion. Working assumption, confirm if it needs adjustment: any curriculum/level signal indicating Matric/SSC/grade 9-10 still triggers the decline flow (6.1 step 7); everything else (O/A-levels, FSc/Intermediate, Computer Science, Skills, University level) is in scope.

## 2. Decision protocol — read this first

If you (Claude Code) encounter a decision this document does not already answer — a missing config value, an ambiguous edge case, a choice between two valid implementation approaches, a new tool/library not listed in Section 4 — **do not decide it yourself and do not guess.** Stop and surface the open question clearly to the operator (name the decision, the options, and your recommendation if you have one). All architectural and product decisions for this project are made in a separate planning conversation, not autonomously during implementation. Proceed only once the operator confirms an answer, and then update this file so the decision is captured for future sessions.

This applies especially to: matching weights/thresholds, LLM prompt wording, database schema changes, new environment variables, third-party services not already named in Section 4, and anything touching cost (a new paid API, a new SaaS dependency).

## 3. Core design philosophy — read this twice

1. **LLM does language only. Code does logic only.** The LLM is used for exactly two jobs: (a) converting one raw WhatsApp message into one structured JSON profile, and (b) writing a natural-language WhatsApp reply from structured data the code already computed. The LLM is NEVER used to compare, rank, filter, or decide matches. Matching is 100% deterministic code.
2. **One LLM call processes one profile only.** When a tutor or parent sends their info, the LLM call receives only that single message and returns only that single structured object. The LLM must never receive the full tutor/parent database, a list of candidates, or historical messages beyond what's needed to fill one profile. This keeps token cost flat regardless of how large the database grows.
3. **Hard filters before soft scoring.** Area (zone/distance), subject, and curriculum level are hard filters — a candidate that fails any of these is excluded before scoring ever runs, no exceptions, no LLM override.
4. **Human-in-the-loop initially.** Every proposed match must be sent to the admin (operator) via WhatsApp for approval before the parent is notified. This is not optional in Phase 1 — it exists to catch bad matches and to generate labeled correction data for later prompt/weight tuning.
5. **No-code tools are explicitly rejected.** Do not use Make.com, Zapier, n8n, or any workflow-builder SaaS. Everything is custom code in one repository.
6. **Everything lives in one deployable app.** Single Next.js application (frontend + backend API routes together), single free-tier deploy. No separate backend service, no microservices, no message queue infrastructure. Simplicity and low maintenance outrank scalability at this stage.

## 4. Tech stack (fixed — do not substitute)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | Frontend + backend API routes in one codebase, one deploy |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` (OpenNext) — **deviation, 2026-10-12**, see below | Operator's explicit choice over Vercel; still free tier and git-push-to-deploy (Cloudflare Workers Builds), but not zero-config the way Vercel was — needs Hyperdrive + a custom worker entry, see notes below |
| Database | Postgres via Supabase free tier | Free, includes hosted Postgres + easy dashboard for manual data checks |
| ORM | Prisma | Type-safe schema, easy migrations |
| WhatsApp | Meta WhatsApp Cloud API (official, direct) | Free tier covers early volume; no third-party SaaS fee (no Wati/AiSensy/Twilio) |
| LLM (structuring + replies) | Groq API (Llama model) as primary, Gemini API free tier as fallback | Both have generous free tiers, fast inference |
| Payments | JazzCash (confirmed) — abstract behind one `payments/` module so provider can be swapped later if needed | Operator's confirmed provider |
| Auth (admin dashboard) | Simple single-admin credential auth (NextAuth with credentials provider, or even a hardcoded env-var password gate for v1) | Only one operator uses this initially — do not over-engineer multi-tenant auth |
| Styling | Tailwind CSS | Fast to build with, no design system overhead needed for an internal admin tool |

**Approved additional libraries** (ratified during Phase 0/1 build, not a deviation from Section 3's "do not introduce additional tools" rule — these are dependencies within the stack above, not new services): `zod` (validating LLM JSON output before it hits the DB), `vitest` + `tsx` (unit tests for the matching engine and finance calculators, per the "fully unit-testable" requirement in 6.3/6.9), `groq-sdk`, `@google/generative-ai`, `fflate` (zip handling for the chat-export import pivot — see Section 6.1's replacement note), `react-leaflet` + `leaflet` (heat map rendering — Section 6.11 — using free OpenStreetMap tiles, no API key, no billing, unlike Google Maps JS). All free, no added SaaS surface. **No Facebook/Instagram SDK package** — the Graph API is plain REST (`fetch` calls to `graph.facebook.com`, Section 6.5); do not add `facebook-nodejs-business-sdk` or similar, it's unnecessary weight for the one endpoint this project uses.

**Confirmed, 2026-10-12 — stays Groq/Gemini, not Claude.** Briefly considered switching the extraction LLM to the Anthropic Claude API (so "Claude Code" would do the extraction); operator explicitly rejected any paid API beyond their existing Claude Code subscription ("i aint paying a shit other than my claude code"). There is no supported way for this app's backend to call into a Claude Code session or a Claude.ai subscription as an API — that's a different product/billing surface from the Anthropic Developer API. Groq + Gemini's free tiers remain the only viable zero-cost option and are unchanged from the original design.

**Deviation, 2026-10-12 — hosting is Cloudflare Workers, not Vercel. LIVE AND WORKING, but it was a genuinely hard integration — read this before touching `lib/db.ts`, `prisma/schema.prisma`, or `next.config.mjs`.** Operator's explicit request (rejected reverting to Vercel even after the Prisma/Workers incompatibility below surfaced — don't re-litigate this). Deployed at `https://tutor-parent-matching.umerfarooqsqa.workers.dev`, repo at `https://github.com/umerfarooqsqa/academy`, deployed manually via `wrangler` CLI (already authenticated on the operator's machine) rather than Cloudflare Workers Builds' git-integration — that integration was never finished; see "Operator prerequisites" below if that's wanted later.

Cloudflare's own new `vinext` framework was rejected as too immature for a production app (its own README says it's "not yet a drop-in replacement... for production workloads"); used **`@opennextjs/cloudflare`** (OpenNext) instead. This is not simpler than Vercel was for this app — it trades Vercel's zero-config native Next.js hosting for several extra moving pieces:

- **Database connectivity**: Cloudflare Workers can't open a raw TCP connection to Postgres. Bridged via **Cloudflare Hyperdrive** (`wrangler hyperdrive create`, id lives in `wrangler.jsonc`'s `hyperdrive[0].id`) pointed at the real Supabase connection string, plus Prisma's driver-adapter support (`@prisma/adapter-pg` + `pg`, replacing Prisma's bundled query engine).
- **The hard part — Prisma's query engine and Cloudflare Workers' WASM restrictions.** This took several failed attempts, each with a different error, before landing on a working combination. In order:
  1. Plain `prisma generate` (default engine type) bundles a *native binary* query engine for whatever OS generated it — works locally, fails on Cloudflare entirely ("Query Engine for runtime debian-openssl-1.1.x" — Workers cannot execute native binaries at all, categorically, regardless of which `binaryTargets` you list).
  2. `prisma generate --no-engine` (what older Cloudflare/Prisma docs show for driver adapters) throws a validation error against the `adapter` option on this Prisma version (6.19.3) — that flag is for a different use case (Accelerate) on this version, not driver adapters.
  3. The actual correct generator setting is **`engineType = "client"`** (GA since Prisma 6.16) — a Rust-free, WASM-based query compiler. But Cloudflare Workers forbids compiling WebAssembly from raw bytes at runtime, and Prisma's generated *default* entry point (`@prisma/client`'s `index.js`) loads that WASM via a plain Node `fs` read — which fails on Cloudflare ("no such file or directory, readAll '.../query_compiler_bg.wasm'") because webpack resolves that `require()` using Node conditions at `next build` time, long before wrangler's own esbuild pass for the Workers target ever runs. The generator's `runtime = "workerd"` setting (also required) doesn't help *this specific* require() — it generates the right workerd-safe loader file, but the default entry point never reaches it.
  4. The fix: `next.config.mjs` needs `outputFileTracingIncludes: { "/**": ["./node_modules/.prisma/client/**"] }` — marking `.prisma/client` as `serverExternalPackages` (needed so Next doesn't try to bundle it) *also* stops Next's file-tracer from copying its runtime files into the deployment output at all; without this, only `schema.prisma` made it into the bundle, nothing else.
  5. Even with the file present, `lib/db.ts` must import `PrismaClient` from the explicit **`@prisma/client/wasm`** subpath, not the bare `@prisma/client` — the default entry's `index.js` has its own separate, broken wasm-loading logic (the readAll error above) that the `/wasm` subpath sidesteps entirely by always using the proper `import()`-based loader.
  6. But `@prisma/client/wasm`'s `import()` of a `.wasm` file is still an experimental, unreliable feature in plain Node.js — so this subpath **breaks local dev** ("the loaded wasm module was unexpectedly undefined or null once loaded"). `lib/db.ts` therefore picks the entry point dynamically per environment, using `navigator.userAgent === "Cloudflare-Workers"` as the real-Workers-runtime signal (NOT `getCloudflareContext()` succeeding — that's also true during local `next dev`, on purpose, for Hyperdrive emulation, so it can't distinguish real Workers from emulated local dev).
  7. One more bug surfaced only once all of the above worked: a Prisma client (and its `pg` Pool/connection) **cached across requests within one Worker isolate works for exactly one request, then every subsequent request on that isolate hangs** until Cloudflare force-kills it. This matches Cloudflare's own documented Hyperdrive guidance (don't share one client across requests in a Worker — Hyperdrive is specifically built to make creating a fresh one per request cheap). `lib/db.ts`'s `prisma` export is a `Proxy` on real Workers that builds a brand-new client on every top-level `prisma.<model>` access; local dev keeps the normal cached-singleton pattern. The one wrinkle: `$transaction([...])` requires every batched operation to come from the *same* client instance, which the Proxy can't guarantee since the array is built before `$transaction` runs — `lib/db.ts` exports `transactionClient()` for exactly those two call sites (`lib/matching/run.ts`, `lib/parents/actions.ts`) to build the array against one explicit client instead of the plain `prisma` export.
  - **If Prisma is ever upgraded, re-verify all seven of the above** — several of them directly contradict what Cloudflare's and Prisma's own published docs say for *older* versions, and this is an actively-changing area of Prisma's tooling (Accelerate itself is being retired December 1, 2026 — confirmed live on Prisma's own docs — so don't reach for it as a fallback).
- **Cron**: `vercel.json` is gone, replaced by `wrangler.jsonc`'s `triggers.crons` + a custom Worker entry (`worker.ts`) that re-exports OpenNext's generated `fetch` handler and adds a `scheduled` handler (OpenNext's generated Worker only exports `fetch` by default). The scheduled handler calls the same three existing cron routes via internal HTTP requests, carrying the same `CRON_SECRET` bearer header `lib/cron/guard.ts` already checks — those routes and that guard are completely unchanged.
- **Local dev**: `next.config.mjs` calls `initOpenNextCloudflareForDev()`, gated to `NODE_ENV === "development"` only (calling it unconditionally also fires during `next build`, local and in CI, which then demands a local Postgres connection string to emulate Hyperdrive even though production builds never need local emulation at all). This requires a `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` value in **`.env.local`** specifically (not `.dev.vars` — verified live that this particular check reads `process.env` directly, bypassing Wrangler's own `.dev.vars` loading despite that being the more "obvious" place for it).
- **Windows caveat**: OpenNext's Cloudflare build tooling doesn't guarantee Windows support (the operator's dev OS) — in practice it worked fine here (`npm run cf:build` / `npx wrangler deploy` both ran clean on Windows), but if it ever doesn't, Cloudflare Workers Builds (git-integration, same idea as Vercel's git-push-to-deploy) sidesteps the operator's machine entirely since Cloudflare's own build runners aren't Windows.
- **CI auto-deploy — done, not Cloudflare Workers Builds.** Abandoned Cloudflare's own dashboard git-integration (Workers Builds) partway through — used a plain GitHub Actions workflow instead (`.github/workflows/deploy.yml`), which needed its own round of fixes verified live: (1) `cloudflare/wrangler-action@v3`'s underlying `opennextjs-cloudflare deploy` call needs `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` set (any placeholder value — never actually connected to) or it throws the same local-emulation error `next build` does; (2) a scoped Cloudflare API token can't auto-detect its account, so `account_id` has to be set explicitly in `wrangler.jsonc` itself (a `CLOUDFLARE_ACCOUNT_ID` env var on the step was NOT enough — verified, it's specifically this internal `opennextjs-cloudflare deploy` call path that needs the config-file value); (3) the Cloudflare API token must be created via the "Edit Cloudflare Workers" template with **Account Resources explicitly including the real account** — the first token created this way somehow ended up unable to see any Workers scripts at all ("No access to the specified service") despite looking correctly scoped, and needed to be regenerated. Every push to `main` now auto-deploys for real — confirmed live via a full CI run, not just a successful-looking log.
- `CRON_SECRET` and every other secret (Section 9) are supplied via `wrangler secret put <NAME>` (Worker-level encrypted secrets), not a `vars` block in `wrangler.jsonc` and not a Vercel project env var.

## 5. Data models (Prisma schema — implement exactly this shape, extend only if a gap is found)

```prisma
model Tutor {
  id                 String   @id @default(cuid())
  whatsappId         String   @unique
  campaignId         String?
  campaign           Campaign? @relation(fields: [campaignId], references: [id])
  name               String
  email              String?
  phone              String?  // callback number, only if different from whatsappId — never force-asked
  qualification      String   // e.g. "O-levels, A-levels"
  subjects           String[] // e.g. ["Chemistry", "Biology"]
  subjectGroup       String   // "pre_medical" | "pre_engineering" | "computer" | "skills" |
                               // "university_level" | "other" — 6.1 step 8. This is the hard-filter
                               // field in matching (6.3 Step 1); `curriculum` below is descriptive only.
  curriculum         String   // free-text board/level, e.g. "Cambridge A-levels", "FSc Pre-Medical"
  gradesBySubject    Json?    // self-reported, e.g. {"Biology": "A"} — 6.1 step 9, scored in 6.3 Step 4
  cnicImageUrl       String?  // Supabase Storage URL — verification only, never OCR'd (6.1 step 10)
  cnicVerifiedAt     DateTime? // **deviation, 2026-10-14**: set when an admin marks the CNIC checked on
                               // /tutors/[id]; cleared whenever the CNIC image is replaced. Required for
                               // the public "verified tutor" count (lib/tutors/verified.ts).
  marksheetImageUrls String[] @default([])
  area               String   // AreaZone.name — landmark classified to nearest zone (6.1 step 11)
  latitude           Float?   // populated from the matched AreaZone's centroid by default, or
                               // overridden with a precise coordinate when a shared Google Maps
                               // location link is found (lib/geo/googleMapsLink.ts — **deviation,
                               // 2026-10-13**, see note below) — still never used by the matching
                               // engine's hard filters, which stay zone-name-based (6.3)
  longitude          Float?
  availability       String[] // fixed tag set only (6.2) — never free text
  expectedFee        Int?     // monthly fee in PKR — neutral-default handling when unset (6.3 Step 4)
  rating             Float    @default(0)  // running average of parent star ratings (1-5)
  ratingCount        Int      @default(0)
  tier               String   @default("free") // "free" | "premium" — derived live from an active
                               // TutorSubscription at notification time (6.5), never cached
  deliveryMode       String   @default("in_person") // "in_person" | "online" | "both" (6.5)
  radiusOverrideKm   Float?   // premium-only wider matching radius opt-in (6.5)
  status             String   @default("pending") // pending | active | inactive
  internalNote       String?  // operator-facing flags, e.g. "curriculum ambiguous — verify" —
                               // never shown to the tutor/parent. Same field name/purpose used
                               // consistently across every model below.
  rawMessage         String   // original WhatsApp text, kept for audit/training
  createdAt          DateTime @default(now())

  subscriptions      TutorSubscription[]
  matches            Match[]
  ratings            Rating[]
}

model TutorSubscription {
  id            String   @id @default(cuid())
  tutorId       String
  tutor         Tutor    @relation(fields: [tutorId], references: [id])
  status        String   @default("active") // active | lapsed | cancelled
  amount        Int      // monthly registration fee, in PKR
  paymentMethod String?  // free text for the operator's own record only — e.g. "JazzCash manual
                          // transfer", "bank transfer", "cash". NOT a payment gateway integration;
                          // this row is created manually by the operator (6.5), no webhook exists.
  periodStart   DateTime
  periodEnd     DateTime // Tutor.tier is "premium" only while now() is within an active
                          // subscription's period — checked live, not cached on Tutor
  createdAt     DateTime @default(now())
}

model ParentRequest {
  id            String   @id @default(cuid())
  whatsappId    String
  campaignId    String?  // attributed via Meta ad-referral webhook (6.1) or manually tagged by
                          // the operator for non-Meta-ad channels. Null = unattributed, expected.
  campaign      Campaign? @relation(fields: [campaignId], references: [id])
  studentInfo   String?
  subjects      String[]
  subjectGroup  String   // same fixed set as Tutor.subjectGroup — the matching hard filter (6.3 Step 1)
  curriculum    String
  area          String
  latitude      Float?   // **deviation, 2026-10-13**: not in the original Section 5 shape — added
                          // alongside Tutor.latitude/longitude for the Google-Maps-location-link
                          // feature (lib/geo/googleMapsLink.ts). Populated only when a shared
                          // location link was found; null otherwise. Never used by the matching
                          // engine's hard filters, which stay zone-name-based (6.3).
  longitude     Float?
  budget        Int?     // frequently null — expected, handled gracefully (6.3 Step 3), never a hard reject
  deliveryMode  String   @default("in_person") // "in_person" | "online" | "both" — determines whether
                          // Tier A/B geo-filtering applies in matching (6.3 Step 2)
  availability  String[] // fixed tag set only (6.2) — never free text
  status        String   @default("pending") // pending | matched | closed
  internalNote  String?  // e.g. "curriculum ambiguous — verify", "budget not provided — confirm with parent"
  rawMessage    String
  createdAt     DateTime @default(now())

  matches       Match[]
}

model IntakeSession {
  id          String   @id @default(cuid())
  whatsappId  String   @unique
  senderType  String   // "tutor" | "parent" | "unknown" — determined on first message
  step        String   // current step in the per-whatsappId form flow, e.g. "awaiting_area" (6.1 step 3)
  partialData Json?    // fields collected so far, merged in as follow-up answers arrive
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
}

model AreaZone {
  id        String @id @default(cuid())
  name      String @unique
  latitude  Float
  longitude Float
  maxKm     Float  @default(6) // max distance for a Tier B match involving this zone (6.3 Step 2)
}

model Match {
  id              String   @id @default(cuid())
  parentRequestId String
  parentRequest   ParentRequest @relation(fields: [parentRequestId], references: [id])
  tutorId         String
  tutor           Tutor    @relation(fields: [tutorId], references: [id])
  score           Float
  status          String   @default("awaiting_approval")
  // awaiting_approval | approved | rejected | sent_to_parent | selected | demo_scheduled | paid | completed
  internalNote    String?  // e.g. "budget not provided — confirm with parent" (6.3 Step 3)
  opportunityCode String?  @unique // short reference (e.g. "OPP-1234") shown on the public
                            // /opportunities page (6.5, 7) — generated when published, null
                            // while still in the premium-only notification window
  publishedToPageAt DateTime? // when this Match became visible on /opportunities — null until
                            // the premium delay window (6.5) elapses with no confirmed tutor
  demoSlots       Json?    // candidate times the operator offers, entered manually in /matches (6.6)
  demoScheduledAt DateTime? // the slot the parent actually confirmed
  createdAt       DateTime @default(now())

  approvalLogs    ApprovalLog[]
  payments        Payment[]
  ratings         Rating[]
}

model ApprovalLog {
  id        String   @id @default(cuid())
  matchId   String
  match     Match    @relation(fields: [matchId], references: [id])
  action    String   // approved | rejected | edited
  before    Json?    // proposed match data
  after     Json?    // what the operator actually did — correction data for future tuning
  createdAt DateTime @default(now())
}

model Payment {
  id          String   @id @default(cuid())
  matchId     String
  match       Match    @relation(fields: [matchId], references: [id])
  amount      Int
  commission  Int
  tutorPayout Int
  status      String   @default("pending") // pending | collected | paid_out
  provider    String   @default("jazzcash")
  createdAt   DateTime @default(now())
}

model Rating {
  id        String   @id @default(cuid())
  matchId   String
  match     Match    @relation(fields: [matchId], references: [id])
  tutorId   String
  tutor     Tutor    @relation(fields: [tutorId], references: [id])
  stars     Int      // 1-5, submitted by parent — feeds Tutor.rating running average (6.8)
  comment   String?
  createdAt DateTime @default(now())
}

model MarketingSpend {
  id         String   @id @default(cuid())
  campaignId String?  // nullable for one-off/general spend not tied to a specific campaign test
  campaign   Campaign? @relation(fields: [campaignId], references: [id])
  channel    String   // "meta_ads" | "tutor_referral" | "organic_post" | "other" — same fixed set as Campaign.channel
  area       String?  // AreaZone.name this spend targeted, null if general
  amount     Int      // in PKR
  spentOn    DateTime // date spend occurred (not createdAt) — for accurate period reports
  notes      String?
  createdAt  DateTime @default(now())
}

model SystemState {
  key       String   @id // e.g. "last_facebook_digest_posted_at" — a generic, reusable
                          // key-value slot for small singleton state, avoiding a proliferation
                          // of one-purpose tables for things like "did the daily digest already run today"
  value     String
  updatedAt DateTime @updatedAt
}

model Campaign {
  id           String   @id @default(cuid())
  name         String   // e.g. "Meta Ads - North Nazimabad - Audience A (exam-prep interest)"
  channel      String   // "meta_ads" | "tutor_referral" | "organic_post" | "other"
  area         String?
  audienceNote String?  // targeting description — this is what makes two campaigns a real A/B pair
  metaAdId     String?  @unique // Meta's ad ID, set only for channel="meta_ads". Matches the inbound
                          // webhook's `referral` payload silently (6.1, 6.10) — no visible code or link.
  startDate    DateTime @default(now())
  endDate      DateTime?
  createdAt    DateTime @default(now())

  tutors          Tutor[]
  parentRequests  ParentRequest[]
  marketingSpends MarketingSpend[]
}
```

## 6. Core workflows — implement exactly in this order

Index: 6.1 Intake · 6.2 LLM extraction · 6.3 Matching engine · 6.4 Admin approval · 6.5 Tutor tiers/priority/delivery mode · 6.6 Parent notification/demo · 6.7 Payment/payout · 6.8 Tutor rating · 6.9 Cost-per-deal calculator · 6.10 Campaign funnel/A-B · 6.11 Tutor density heat map

### 6.1 Intake (WhatsApp → structured profile)
1. Meta Cloud API webhook (`/api/whatsapp/webhook`) receives an inbound message.
2. **Campaign attribution — invisible, no visible code or link tampering.** For click-to-WhatsApp Meta ads, Meta's webhook payload includes a `referral` object (ad ID, headline, source) on the very first message from that click. If present, match `referral.source_id` against `Campaign.metaAdId` and set `campaignId` on the new `Tutor`/`ParentRequest` row automatically — nothing is added to or parsed from the message text itself, so the parent never sees anything that could look like a tracking code or suspicious link. For channels without this payload (tutor referrals, organic Facebook-group posts, word of mouth), automatic attribution isn't possible — leave `campaignId` null at intake, and let the operator manually assign the correct `Campaign` from a dropdown on the `/parents` or `/tutors` dashboard page afterward, if known. Unattributed (`campaignId: null`) is a normal, expected state, not an error — it just won't appear broken out in the A/B table (6.10), only in the overall totals (6.9).
3. Determine if sender is a new/existing tutor or parent (simple state machine per whatsappId — track "what step of the form is this person on" in a lightweight session table or in-memory-per-request logic backed by DB, not a separate queue service).
4. Send the **single message** to the LLM extraction call (see 6.2 for exact prompt contract). Never batch multiple people's messages into one call.
5. If required fields are missing, behavior differs by sender type:
   - **Tutor**: the bot must always ask a targeted WhatsApp follow-up for each missing field until the profile is complete. Tutor data must be clean before it ever enters the matching pool — never let an incomplete tutor profile go to `status: active`. Ask only for the missing field, not the whole form again.
   - **Parent**: if fields are missing (most commonly budget — see 6.3 for why this is expected and handled gracefully), the bot flags the request as `status: pending` with the gap noted, then offers the parent a choice: continue answering over WhatsApp, or have the operator call them directly. If the parent picks a call, create a note visible on the `/parents` dashboard page and notify the operator via WhatsApp so it can be handled in the Fri/Sat/Sun or evening call slot.
6. Once complete (or once a parent has opted into a call), upsert into `Tutor` or `ParentRequest` accordingly.
7. **Curriculum scope check — revised for expanded scope (Section 1).** Only Matric/SSC (grade 9-10 board curriculum) triggers a decline now — O/A-levels, FSc/Intermediate (pre-medical, pre-engineering), Computer Science, Skills, and University-level are all in scope.
   - **Decline** (case-insensitive match): Matric, SSC, "grade 9", "grade 10", "9th", "10th" — with no higher-tier signal (A-level, FSc, Intermediate, university, etc.) also present in the same message.
   - **Ambiguous** (unclear, or the LLM itself is uncertain): do NOT auto-decline. Proceed with normal intake, `internalNote: "curriculum ambiguous — verify"`, operator confirms manually — same principle as before, a false decline costs more than one manual check.
   - If declined, the bot sends the curriculum decline message (Section 13) and does not proceed with the rest of structured intake.
8. **Subject group classification (tutors and parents both).** Extracted as `subjectGroup`, one of a fixed set: `pre_medical | pre_engineering | computer | skills | university_level | other`. This is a category tag alongside the existing free-text `curriculum` field, not a replacement for it — `curriculum` still captures the specific board/level (e.g. "Cambridge A-levels", "FSc Pre-Medical", "BS Computer Science"), `subjectGroup` is the broader bucket used for filtering and messaging.
9. **Tutor-only: self-reported subject grades.** After the standard fields are collected, ask the tutor to self-report grades for their subjects (Section 13 has the exact prompt) — e.g. "Biology: A, Chemistry: A-". Extracted into `Tutor.gradesBySubject` (Json) via the same LLM call pattern as everything else — cheap, one profile, one call. This is self-reported, not automatically verified — see step 11 for how verification actually happens.
10. **Tutor-only: CNIC and marksheet images — stored, never sent to an LLM.** When the tutor sends an image message (CNIC, marksheet), the webhook downloads it once via Meta's media API (media links expire quickly, so download immediately) and uploads it to Supabase Storage (free tier — already in the stack, no new service), storing the resulting URL on `Tutor.cnicImageUrl` / `Tutor.marksheetImageUrls[]`. No OCR, no vision-model call — these exist purely as verification attachments the operator glances at during admin approval (6.4) to sanity-check the self-reported grades from step 9. Running these through a vision model would add real per-registration cost for marginal benefit over a 5-second human glance.
11. **Tutor-only: location via nearest landmark, mapped to an existing zone — not a geocoding API call.** The tutor states a landmark/area description in free text (e.g. "near Sohrab Goth flyover"). Because the matching engine (6.3) is already zone-based rather than GPS-precise, the extraction LLM classifies this text against the current `AreaZone.name` list (passed into the prompt as the allowed values) and picks the closest match — no external geocoding service, no added per-registration cost, consistent with the "least charged" goal. If nothing matches confidently, set `internalNote: "location unclear — verify zone"` rather than guessing.

### 6.2 LLM extraction call contract
- Input: one raw WhatsApp message string (plus, if this is a follow-up answer, the field it's answering, and the sender type — tutor or parent — from `IntakeSession.senderType`). For the `area`/zone classification step (both sender types) and for a tutor's grades step, the prompt also includes the current `AreaZone.name` list and, for grades, no extra context needed since it's a direct self-report.
- Model: `openai/gpt-oss-20b` via Groq (primary — **deviation, 2026-10-12**, see Section 4: Groq discontinued the originally-specified `llama-3.3-70b-versatile`), Gemini free tier as fallback if Groq errors or rate-limits. Both support JSON-mode/structured output — use it rather than parsing free-form text.
- Output schema (validate with `zod` before writing to the DB — never trust raw LLM output unchecked):

```
// Tutor
{
  name: string | null,
  email: string | null,
  phone: string | null,
  qualification: string | null,
  subjects: string[] | null,
  subjectGroup: "pre_medical" | "pre_engineering" | "computer" | "skills" | "university_level" | "other" | null,
  curriculum: string | null,
  gradesBySubject: { [subject: string]: string } | null,  // e.g. {"Biology": "A"} — self-reported
  area: string | null,   // must be classified to the closest AreaZone.name given in the prompt
  availability: string[] | null,   // ONLY values from the fixed set below
  expectedFee: number | null,      // monthly fee in PKR, if mentioned
  missingFields: string[]
}

// Parent
{
  studentInfo: string | null,
  subjects: string[] | null,
  subjectGroup: "pre_medical" | "pre_engineering" | "computer" | "skills" | "university_level" | "other" | null,
  curriculum: string | null,
  area: string | null,   // must be classified to the closest AreaZone.name given in the prompt
  budget: number | null,
  availability: string[] | null,   // ONLY values from the fixed set below
  missingFields: string[]
}
```
- **CNIC and marksheet images are never sent through this extraction call** — see 6.1 step 10. They're handled entirely outside the LLM pipeline (direct download + storage), which is also why they don't appear in this schema at all.
- Fixed availability tag set (used identically for tutors and parents, feeds 6.3 Step 4's `availabilityOverlap`): `weekday_morning`, `weekday_afternoon`, `weekday_evening`, `weekend_morning`, `weekend_afternoon`, `weekend_evening`. The LLM must never invent a tag outside this list — if a mentioned time doesn't clearly map to one of these, leave it out of the array rather than guessing.
- **Exact system prompt** (store verbatim in `lib/prompts/extract.ts`, parameterized by `{SENDER_TYPE}`, the corresponding schema block above, and `{AREA_ZONE_NAMES}` — the current list of `AreaZone.name` values, needed for the area classification step):

  > "You are extracting ONE structured profile from ONE WhatsApp message. Never invent data that is not present in or clearly implied by the message. Sender type: {SENDER_TYPE}. Return only valid JSON matching the schema you've been given — no explanation, no markdown code fences, no extra keys. If a field is absent or unclear, set it to null and add its key name to the missingFields array. For the availability field, use only values from the fixed list you've been given — if a mentioned time doesn't clearly map to one of those values, omit it rather than guessing. For the area field, classify the message's location/landmark description to the single closest match from this list of known zones: {AREA_ZONE_NAMES} — if nothing matches with reasonable confidence, set area to null rather than guessing. Do not add subjects, curriculum, or area values that are not explicitly stated or clearly implied by the message."

### 6.3 Matching engine (pure code, zero LLM calls)
Given a `ParentRequest`, evaluate all `status: active` tutors:
```
Step 1 — Hard filters (reject if any fail):
  - subject overlap (at least one shared subject)
  - subjectGroup exact match (categorical field, e.g. "pre_medical" — NOT the free-text
    `curriculum` field, which varies in phrasing between tutor/parent messages and is
    descriptive only, never used for filtering)

Step 2 — Tiered area matching (this is the direct fix for the past area-mismatch failure).
  SKIP THIS ENTIRE STEP if ParentRequest.deliveryMode = "online" — proceed straight to
  Step 3 with every subjectGroup/subject-matched tutor as a candidate, regardless of area
  (see 6.5 for the full online-delivery-mode rationale).
  Tier A: filter tutors whose AreaZone.name exactly matches the parent's AreaZone.name.
          If Tier A returns at least one candidate, use ONLY Tier A candidates — do not
          fall through to Tier B even if Tier A has few results.
  Tier B: only if Tier A returns zero candidates, fall back to geo-radius search —
          Haversine distance between tutor and parent AreaZone lat/long, keep candidates
          with distance <= AreaZone.maxKm (or Tutor.radiusOverrideKm if set — 6.5). This
          tier exists so a request in an underserved zone still gets options, but same-area
          is always preferred first.

Step 3 — Budget handling (parents frequently don't provide budget — this is expected,
  not an error):
  - If ParentRequest.budget is null, exclude the budget-fit term from scoring entirely for
    this match and renormalize the remaining weights to sum to 1 (do not treat missing
    budget as a zero or a penalty).
  - Add internalNote: "budget not provided — confirm with parent" on the resulting Match
    row so the operator sees it during approval (6.4) and can ask directly.
  - Confirmed decision: an explicitly LOW stated budget (e.g. Rs 3,000/month) is NOT a hard
    reject, even given the premium-only positioning (Section 1, Section 11) — it stays
    soft-scored via `budgetFit` below. A low-budget parent simply ranks lower against
    tutors who don't fit that budget, never blocked outright.

Step 4 — Score remaining candidates:
  score = w1*budgetFit + w2*(tutor.rating/5) + w3*(1/(1+geoDistanceKm)) + w4*availabilityOverlap + w5*subjectGradeStrength
  Default weights (constants in lib/matching/weights.ts, tunable): w1=0.2, w2=0.25, w3=0.15,
  w4=0.15, w5=0.25. subjectGradeStrength and rating are weighted highest since subject-specific
  academic strength (6.1 step 9) and tutor quality are the primary differentiators.

  GENERAL RULE — applies to every formula below: when an input a formula needs is missing
  (tutor hasn't stated a fee, hasn't listed availability, hasn't self-reported a grade for
  a given subject), that term scores 0.5 (neutral), never 0 and never 1. An unstated field
  is not evidence of a mismatch — don't let scoring imply otherwise.

  budgetFit: 1.0 if Tutor.expectedFee <= parent.budget; else linearly decays to 0 once
    expectedFee is 50%+ above parent.budget: max(0, 1 - (expectedFee - budget) / (0.5*budget)).
    0.5 if expectedFee is unset (see general rule above).

  availabilityOverlap: |intersection of Tutor.availability and ParentRequest.availability| /
    |ParentRequest.availability| (both are arrays from the fixed tag set in 6.2). 0.5 if
    parent.availability is empty (see general rule above).

  subjectGradeStrength (confirmed soft-scored, never a hard filter):
    - Only over the subject(s) that overlap between Tutor.subjects and ParentRequest.subjects
      (the same overlap that satisfied the Step 1 hard filter) — not the tutor's full subject list.
    - Per overlapping subject, map Tutor.gradesBySubject[subject] via this table (store in
      lib/matching/grades.ts): A+/A=1.0, A-=0.9, B+=0.8, B=0.7, B-=0.6, C+ and below=0.5.
      A percentage grade maps as min(1, percentage/100), rounded to the nearest band above.
      Missing entry for that subject → 0.5 (see general rule above).
    - subjectGradeStrength = average of the per-subject scores.

Step 5 — Return top 3 candidates by score, create Match rows with status "awaiting_approval"
```
This logic lives in `lib/matching/engine.ts`, fully unit-testable, no external API calls.

### 6.4 Admin approval (WhatsApp)
- When Match rows are created, send the operator a WhatsApp message summarizing each proposed match (tutor name, score, key attributes) with a simple reply protocol (e.g. reply "1 yes", "2 no", "1 edit: <note>").
- Log every response into `ApprovalLog` with before/after — this is the dataset that later improves prompt few-shot examples and matching weights. No fine-tuning pipeline needed yet; this log is just reviewed periodically by the operator.
- Only approved matches proceed to 6.6.

### 6.5 Tutor tiers, priority notification, and delivery mode

**Tutor tier.** `Tutor.tier` is `"free"` or `"premium"`. Premium requires an active recurring subscription — see the `TutorSubscription` model (Section 5). A tutor with a lapsed/unpaid subscription reverts to `"free"` automatically (checked at notification time, not just at signup — a premium perk must never fire for a tutor whose payment lapsed).

**No automated payment integration for tutor subscriptions — confirmed, deliberate.** Unlike parent payments (6.7, which use the JazzCash webhook), the tutor registration fee is collected manually outside the platform — bank transfer, JazzCash sent directly, cash, whatever the tutor and operator arrange. Once the operator receives it, they create a `TutorSubscription` row themselves from the `/tutors` dashboard page (tutor, amount, period dates, and a free-text `paymentMethod` note for their own records). There is no payment link, no webhook, and no `/api/subscriptions` write path exposed to tutors — this endpoint is admin-only, driven entirely by the dashboard. This keeps Phase 4.5 independent of the JazzCash integration entirely — it can be built without waiting on Phase 4, since it's just a DB table, a dashboard form, and the WhatsApp notification logic below.

**Delivery mode.** `Tutor.deliveryMode` and `ParentRequest.deliveryMode` are each `"in_person" | "online" | "both"`. When a `ParentRequest.deliveryMode` is `"online"`, the matching engine (6.3) skips the Tier A/B geo-filtering entirely for that request — subject, curriculum, and tier-priority scoring still apply, geo-distance does not. Online requests are open to all tutors regardless of tier (confirmed decision — not premium-exclusive), but premium tutors get first, private notification of them per the mechanism below, same as in-person requests.

**Priority notification mechanism — revised for WhatsApp messaging cost control.** Business-initiated WhatsApp messages outside an active conversation window require a paid template (Meta's per-message pricing — see the cost discussion this section is built around). Sending one to every candidate tutor on every match doesn't scale cheaply, so premium and free tiers now use genuinely different channels, not just different timing:

1. After a Match row is approved (6.4), **premium candidate tutors are sent a WhatsApp opportunity message immediately** (Section 13 wording), asking them to confirm interest. This is the core paid-tier benefit, and its cost is funded by the tutor's subscription fee (6.5) — it's a justified cost, not an unfunded feature.
2. If no premium tutor confirms interest within `PREMIUM_NOTIFICATION_DELAY_MINUTES` (default 60 — Section 9), the opportunity is published to the public `/opportunities` page (Section 7) — a plain page listing open requests (subject, subjectGroup, area, curriculum, a short reference code like `OPP-1234`) with **no parent contact info**. Publishing is a DB write, not a WhatsApp message — zero cost regardless of how many tutors see it.
3. **Free-tier tutors get no WhatsApp push at all** — confirmed decision, made specifically to keep free-tier cost at zero rather than relying on a delayed template send. They check `/opportunities` themselves and, if interested, message the bot with the reference code (e.g. "interested in OPP-1234"). Because the tutor initiated that message, it's a free service reply, not a billable business-initiated template — this is the structural fix, not a workaround.
4. The bot recognizes an `OPP-XXXX` pattern in an inbound message (simple regex, no LLM call needed) and links the sender to that `Match` as a confirmed-interest tutor, same as a premium tutor's WhatsApp confirmation.
5. Only tutors who confirm interest (either channel) get included in the ranked list sent to the parent (6.6) — never the raw candidate list, since real-time availability can differ from what's stored.
6. **Rejected as infeasible, do not revisit**: automatically posting to WhatsApp Status via the API. Meta's official Cloud API has no Status-posting endpoint; the third-party tools that claim to (Whapi.Cloud, Wassenger, etc.) are unofficial wrappers that risk the business's single WhatsApp number being banned, and are paid SaaS besides — both disqualifying per Section 3.
7. The delay-based publish trigger is implemented as a simple scheduled check (a periodic route call, not a queue service — consistent with Section 3's no-microservices rule): a `notifyAt` timestamp on the Match, checked by `POST /api/matches/check-notification-delay` (Section 8).

**Deviation, 2026-10-14 — /opportunities fixed, and "near you" messaging for both sides.** Operator request ("doesn't look good UI-wise or business-logic-wise"). Decisions, all operator-confirmed:
- **"I'm interested" happens on the website**, not by messaging the bot a code: each listing has an "I'm interested" button where the tutor types their WhatsApp number → `POST /api/public/opportunity-interest`. The number is matched to `Tutor.whatsappId` on its last 10 digits (`lib/tutors/phone.ts`, since whatsappId is stored as entered). Active tutor → `Match.interestedTutorId` set atomically (hides the listing) + `notifyOperator`; pending tutor → not claimed, operator alerted; unknown number → told to register first; already-claimed → "just taken". Works before the Meta WhatsApp API is live and costs nothing; because the WhatsApp operator alert may fail until then, `/dashboard` also shows a "Tutors interested" tile (approved matches with an interested tutor). Step 4 above (bot regex-matching `OPP-XXXX` in inbound WhatsApp) is still not built.
- **What counts as an open listing** (`lib/opportunities/openListings.ts`, used by `/opportunities`, `GET /api/opportunities` and the Facebook digest): Match `status: "approved"`, published within the last **14 days** (`OPPORTUNITY_MAX_AGE_DAYS`), ParentRequest not `closed`, and no Match of that request has an interested tutor. **One listing per parent request** (previously up to 3 — one per candidate Match), using the first-published Match's code.
- **"Near you"** for a listing (`lib/opportunities/nearby.ts`): its zone centroid within that zone's own `maxKm` (same rule as Tier B and the Lili form); online and in-person-or-online requests count as near everyone. Distances use zone centroids only, never a parent's own shared coordinate, and run in the browser.
- **Verified tutor** (public claims only — `lib/tutors/verified.ts`): `status: "active"` AND a CNIC image on file AND `cnicVerifiedAt` set by an admin ("✓ Mark CNIC verified" on `/tutors/[id]`; `/tutors` shows "CNIC ✓"). Public pages show only per-zone verified counts (`lib/tutors/nearbyCounts.ts`) — never individual tutors. The counts are rendered server-side into the homepage and `/find-a-tutor` (no separate public counts API was needed).
- **Where it shows**: `/opportunities` redesigned (Lili header, "Show tuitions near me", Near you / Further away split, category chips, cards with Online/distance/posted-ago, the "Share" button kept for manual WhatsApp-group posting with text pointing at the button). The homepage's tutor-only nearby widget is replaced by "What's near you?" (`app/(public)/NearYouSection.tsx`) — one location tap shows parents the verified tutors near them and tutors the tuitions near them. In the `/find-a-tutor` Lili form, after the location answer Lili says "Good news — N verified <category> tutors near <area>!" when N > 0.

**Additional premium perks** (ratified, to be reflected in messaging and dashboard logic, not deep matching-engine changes):
- "Verified Premium" badge shown in the tutor's line when offered to a parent (6.6) — a visible trust signal for the parent, and part of the reason a tutor pays.
- Faster payout turnaround (6.7) — flagged for the operator on `/payments` so premium tutor payouts are prioritized when marking manual transfers complete.
- Wider matching radius — premium tutors may opt into a larger `maxKm` for their own matches (store as `Tutor.radiusOverrideKm Int?`; if set and tutor is premium, use it in Tier B distance checks in place of the zone default).
- No subject-count cap for premium tutors — if a free-tier cap on listed subjects is introduced later, premium is explicitly exempt (not building a cap now — flag as a future lever if needed, not a current requirement).
- **Explicitly deferred, not built now**: a commission discount for premium tutors. This trades directly against revenue and was flagged as worth deciding deliberately rather than defaulting into — do not implement a differential commission rate without an explicit decision recorded here first.

**Additional free-tier distribution channels for `/opportunities` content** — both confirmed, both genuinely free (no per-message WhatsApp billing involved):

1. **Facebook Page auto-digest.** Once daily (via the same periodic scheduled-check pattern used elsewhere in this section — no new infrastructure), a function queries currently-open opportunities (`Match` rows with `publishedToPageAt` set and still unclaimed), formats one plain-text digest post (e.g. "Looking for tutors this week: Biology (North Nazimabad), Computer Science (Gulshan)..."), and posts it to the business Facebook Page via the Graph API (`POST /{page-id}/feed`) — free, no per-post charge, just an API call. One post per day, not one per opportunity — a noisy feed undercuts the premium positioning (Section 11). Use a Page-linked System User token so it doesn't expire on the normal 60-day cycle and need manual renewal. **Instagram is explicitly NOT automated** — Instagram has no text-only post type, every post needs an image, and an auto-generated daily graphic risks looking spammy against the premium brand; Instagram stays a manual, deliberate channel.
2. **Manual copy-paste for WhatsApp groups/communities.** Confirmed decision: do not use the WhatsApp Groups API for this (researched and rejected — capped at 8 participants per group, no bulk-send discount, requires Official Business Account status and a paid invite-link template just to add someone; see Section 12). Instead, the `/opportunities` page includes a "Copy" button per listing (the "Copy all as digest" button was removed at the operator's request, 2026-10-14), generating ready-to-paste plain text (reusing the same formatting function as the Facebook digest, `lib/opportunities/formatText.ts`). The operator pastes this manually into whatever personal WhatsApp groups/communities they're already part of, using their own phone — zero API involvement, zero cost, zero ban risk, and no new infrastructure. This is a deliberately manual step, not automation — it exists because it's a two-second human action that the Groups API can't replace cheaply.

### 6.6 Parent notification → selection → demo
1. LLM reply-generation call turns the approved match list into a natural WhatsApp message to the parent (again: one call, structured input, no candidate-comparison reasoning asked of it — the ranking was already decided by code).
2. Parent replies with their choice.
3. **Demo scheduling — custom, no external calendar tool.** The operator enters 2-4 candidate time slots for the chosen tutor directly on the `/matches` dashboard page (stored in `Match.demoSlots`). The bot sends these as simple numbered options over WhatsApp (e.g. "1) Fri 4pm  2) Sat 11am  3) Sun 5pm — reply with a number"). On the parent's reply, the matched slot is written to `Match.demoScheduledAt` and `Match.status` moves to `demo_scheduled`. This avoids any Calendly/external-scheduling dependency — it's a plain reply-and-match pattern, consistent with keeping the whole system in one codebase with no extra SaaS tools.

### 6.7 Payment and payout
1. After demo, generate a payment link (first month's fee) via the chosen payment provider, sent to parent.
2. On payment webhook confirmation, mark `Payment.status: collected`, compute `commission` and `tutorPayout` (commission percentage stored as an env var / config constant, easy to change), notify operator and tutor.
3. Payout to tutor is manual initially (operator transfers) — do not build an automated payout/disbursement integration in Phase 1; log it as `Payment.status: paid_out` once done manually from the dashboard.

### 6.8 Tutor rating (parent-driven, feeds matching priority)
1. **Automatic trigger, not manual** — confirmed decision, made to keep this a single predictable, forecastable cost per completed deal rather than an ad-hoc one. Exactly `RATING_REQUEST_DELAY_DAYS` (default 30 — Section 9) after the linked `Payment.status` becomes `collected`, the bot sends the parent a WhatsApp star-rating request (Section 13), using the same periodic scheduled-check pattern as the notification-delay mechanism (6.5) — no new infrastructure, no operator action required.
2. On reply, create a `Rating` row, then update the corresponding `Tutor.rating` (running average: `newAvg = (oldAvg * ratingCount + newStars) / (ratingCount + 1)`) and increment `Tutor.ratingCount`.
3. This rating directly feeds the matching engine's `w2` term (6.3, Step 4) — higher-rated tutors are ranked higher and therefore matched at priority, as decided by the operator. No separate "priority" flag is needed; the rating average is the priority signal.
4. A tutor with `ratingCount: 0` uses a neutral default of `rating: 3` (out of 5) for scoring purposes only, consistent with the general neutral-default rule in 6.3 Step 4 — never treated as the worst option by default.

### 6.9 Cost-per-successful-deal calculator (pure code, no LLM)
A "successful deal" is a `Match` whose linked `Payment.status` is `collected` or `paid_out` — i.e. the parent actually paid, not just a demo that happened.

```
Given a date range and optional area filter:

  totalSpend        = sum(MarketingSpend.amount) where spentOn in range (and area matches, if filtered)
  successfulDeals    = count(Payment) where status in [collected, paid_out] and createdAt in range
                        (join through Match -> ParentRequest.area if area-filtering)
  totalCommission    = sum(Payment.commission) where status in [collected, paid_out] and createdAt in range

  costPerDeal        = totalSpend / successfulDeals        (guard against divide-by-zero: show "—" if 0 deals)
  netProfit          = totalCommission - totalSpend
  profitPerDeal       = netProfit / successfulDeals
  breakEvenDealsCount = totalSpend / average(Payment.commission) over the same range
```

This is a straightforward aggregation query, not a forecasting or ML feature — implement it as a single function in `lib/finance/calculator.ts`, unit-testable against seeded data. Always show the four numbers together (cost per deal, profit per deal, net profit, break-even count) — cost per deal alone is misleading without knowing what each deal actually nets after commission.

### 6.10 Campaign funnel and A/B comparison (pure code, extends 6.9)
Every `Campaign` row (a specific ad, audience, or referral push — see the Campaign model) must show its full funnel, not just spend and total profit, so campaigns are genuinely comparable against each other:

```
For a given Campaign:
  leads              = count(ParentRequest where campaignId = X)   [+ Tutor count separately if channel is tutor-side]
  matched            = count(distinct ParentRequest where campaignId = X and has >=1 Match not status "rejected")
  converted          = count(Payment where status in [collected, paid_out]
                              and Payment.matchId -> Match.parentRequestId -> ParentRequest.campaignId = X)
  spend              = sum(MarketingSpend.amount where campaignId = X)
  revenue            = sum(Payment.commission) for the converted set above
  profit             = revenue - spend

  costPerLead        = spend / leads
  leadToMatchRate    = matched / leads
  conversionRate     = converted / leads
  costPerConversion  = spend / converted
  profitPerConversion = profit / converted
```

This is the exact same aggregation pattern as 6.9, just grouped by `campaignId` instead of only by date/area. Implement it as `lib/finance/campaignFunnel.ts`, reusing the same underlying queries as 6.9 rather than duplicating logic — 6.9's overall numbers are simply the sum across all campaigns plus unattributed (`campaignId: null`) leads.

**A/B comparison**: the `/campaigns` page (7) must show every active/past campaign side by side in one table with these funnel numbers as columns, sortable by any column (cost per conversion and profit per conversion are the two that matter most for deciding which audience/creative to keep spending on). `audienceNote` on the Campaign model is what makes two rows a real A/B pair — e.g. two campaigns with the same area and channel but different `audienceNote` targeting descriptions are directly comparable; the table should make it easy to spot that pairing (group or sort by area + channel).

### 6.11 Tutor density heat map (pure code, zero LLM calls, zero geocoding cost)
Purpose: show which `AreaZone`s have the most active tutors, so the operator knows where to point parent-acquisition ad spend (6.10) next — a zone with strong tutor supply but few matched parent requests is a direct signal.

```
For each AreaZone:
  tutorCount = count(Tutor where status = "active" and area = AreaZone.name)
              [optionally filtered by subjectGroup and/or tier — see below]
```

- **No new data needed.** Every tutor already resolves to a known `AreaZone` at intake (6.1 step 11) — this is a straightforward `GROUP BY area` count, not a geocoding or mapping problem. Individual `Tutor.latitude`/`longitude` (Section 5) stay unused here; the heat map plots at the zone centroid (`AreaZone.latitude`/`longitude`), not per-tutor pins.
- **Rendering**: `react-leaflet` + OpenStreetMap tiles (free, no API key, no billing — unlike Google Maps JS API, which requires a billing account even on its free tier). Each `AreaZone` renders as a circle centered on its coordinates, with radius and color intensity scaled to `tutorCount` — genuinely a heat map, not a pin-per-tutor map (which would leak individual tutor locations, an unnecessary privacy exposure the operator doesn't need).
- **Filters**: `subjectGroup` and `tier` (both optional) — e.g. "where are our Computer Science tutors concentrated" or "where are our premium tutors" are both meaningfully different questions from raw tutor count.
- Implement the aggregation as `lib/analytics/tutorDensity.ts`, exposed via `GET /api/zones/tutor-density` (Section 8).
- **Deviation, 2026-10-14 — students on the same map.** Operator request: parent requests ("students") are a second layer — rose rings over the blue tutor circles, same zone-centroid counts, never per-student pins even though some requests now carry a precise shared location. Filters: Show (tutors / students / both), subject group (both layers), tutor tier (tutors only), and **"Only students who still need a tutor"** (on by default) = ParentRequest not `closed` AND no Match `paid`/`completed`. Requests whose area isn't a zone (typed landmarks) are counted separately as "not on the map". Per-zone cards show both counts and flag zones with more students than tutors ("recruit here"). Aggregation: `lib/analytics/studentDensity.ts`, exposed via `GET /api/zones/student-density` (dashboard auth, like tutor-density). **Exact-location dots — admin only (operator decision, same day):** admins (never staff) can turn on small dots for everyone with a precise shared location (students rose, tutors blue; zone-centroid fallbacks are not dots — `lib/analytics/exactLocations.ts#hasExactLocation`). Served by `GET /api/admin/exact-locations`, which is admin-only twice over (`/api/admin` is in middleware.ts's ADMIN_ONLY_PATHS and the route re-checks the role). Tutors on the public site never see where a student is — only a distance (zone-centroid based) on /opportunities and the homepage.

## 7. Web frontend (admin dashboard) — pages required

- `/login` — single admin credential gate
- `/dashboard` — overview: pending approvals count, active tutors, open parent requests, this month's revenue/commission
- `/matches` — list of Match rows with status, filter by status, manual approve/reject/edit as a fallback to the WhatsApp approval flow, and entry of `demoSlots` candidate times (see 6.6) once a match is selected by the parent
- `/tutors` — list/search/edit tutor profiles, activate/deactivate, view CNIC/marksheet images and self-reported grades for verification during approval, and a form to create/renew `TutorSubscription` records (tier, amount, period, payment method note) once the operator has received payment manually — see 6.5
- `/parents` — list/search parent requests, status
- `/zones` — manage AreaZone table (add/edit area name, lat/long, maxKm) — this is how the operator fixes the north-Nazimabad/Malir class of problem directly, without touching code
- `/heatmap` — tutor density heat map (6.11), filterable by subjectGroup and tier, informing where to point parent-acquisition ad spend; since 2026-10-14 also a student layer (all requests, or only those still needing a tutor) — see 6.11
- `/opportunities` — **public, not behind admin auth.** Lists open, unclaimed requests (subject, subjectGroup, area, curriculum, a short `OPP-XXXX` reference code) with no parent contact info — see 6.5. This is the free-tier alternative to a paid WhatsApp push: any tutor can browse it and self-initiate a WhatsApp message referencing the code, which keeps their reply in the free service-message category. **Since 2026-10-14 tutors tap "I'm interested" on the page itself instead (see the 6.5 deviation note).** Each listing has a "Copy" button ("Copy all as digest" removed 2026-10-14, operator request) generating ready-to-paste plain text for the operator to manually post into personal WhatsApp groups/communities (6.5) — client-side clipboard only, no backend cost. Moved into the `(public)` route group (2026-10-13) for the same nav/branding as the rest of the client site. **"Use my location" (2026-10-13 deviation)**: tutors can opt into browser geolocation; distance to each opportunity is computed client-side with the same Haversine function the matching engine already uses (`lib/matching/engine.ts#haversineKm`), against the opportunity's `AreaZone` coordinates (the same data admin manages via `/zones`/`/heatmap`, resolved server-side in `lib/opportunities/digest.ts#getOpenOpportunityListings`) — no new geocoding service, no map library, opt-in only (never requested automatically).
- `/payments` — list of Payment rows, mark manual payouts as complete
- `/finance` — the cost-per-successful-deal calculator (6.9): date range + area filters, showing cost per deal, profit per deal, net profit, break-even deal count, and a simple log/entry form for `MarketingSpend` rows (so ad spend and referral payouts get recorded as they happen, not reconstructed later)
- `/campaigns` — create/edit `Campaign` rows (for `meta_ads` channel, this is where you paste in the Meta ad ID once the ad is live, so inbound leads auto-attribute silently), manually tag `campaignId` on any lead that came in through a non-Meta-ad channel, and the A/B comparison table from 6.10 — the primary page for deciding which audience/creative is actually worth continued spend
- `/logs` — browse ApprovalLog entries (for reviewing correction patterns over time)
- `/website-content` — **new, 2026-10-13 deviation (see below)**: edits the public homepage's copy (headline, pitch text, how-it-works steps, testimonials). Staff-accessible, not admin-only.
- Parent-requests-needing-a-call should surface prominently on `/dashboard` and `/parents` (see 6.1) so the operator can work through them in the Fri/Sat/Sun or evening call slots

Keep every page functional and plain — Tailwind utility styling only, no heavy component library, no animations. This is an internal operator tool, not a customer-facing product.

**Deviation, 2026-10-13 — a real public client website, not just `/opportunities`.** Operator request: a marketing site for both parents and tutors, with forms feeding directly into the existing intake pipeline, content editable from the admin dashboard. Public pages (root layout, no admin nav, same pattern as `/opportunities`): `/` (homepage, replaces the old `redirect("/dashboard")`), `/find-a-tutor` (parent request form), `/become-a-tutor` (tutor registration form, with optional CNIC/marksheet upload). No LLM call involved — a structured web form already gives clean fields, unlike a free-text WhatsApp message, so submissions go straight through `lib/intake/persist.ts`'s existing `createParentRequest`/`upsertTutor` + the same curriculum decline check (6.1 step 7) + `runMatchingForParent`, with the same CNIC-gated tutor activation rule as chat-import (6.1 step 10). Content is stored in the existing `SystemState` singleton table (one key, `"site_content"`, one JSON blob) rather than a new Prisma model — see `lib/siteContent.ts`. New public API routes: `POST /api/public/parent-request`, `POST /api/public/tutor-apply` (both added to `middleware.ts`'s public paths alongside `/`, `/find-a-tutor`, `/become-a-tutor`).

**Deviation, 2026-10-14 — the two public forms now have Lili asking one question at a time, and location is a "Share my location" tap.** Operator request. Lili (the fox mascot, `app/(public)/Lili.tsx`, also on the navbar logo) "says" each question in a single speech bubble (her line types out while she bobs) and the matching field appears beneath her; answered fields stack above as a growing form, each with an Edit link that keeps later answers (operator asked for this over an earlier chat-thread design the same day). Code: `app/(public)/LiliForm.tsx`; pure state logic in `liliFormFlow.ts`; questions + payload builders in `find-a-tutor/parentSteps.ts` and `become-a-tutor/tutorSteps.ts`, wording operator-approved. Still no LLM call — it collects the same structured fields and posts the same payloads as the old forms. The area can also be **typed** (area name or nearby landmark, with matching zones suggested as you type — `lib/geo/zoneLookup.ts#matchZoneByName`, the same matcher as `persist.ts#resolveZone`); typed text that matches no zone is stored as-is with the existing `"area not in zone table — add the zone or correct the area"` note for the operator to fix — there's no LLM on this path to classify landmarks the way 6.1 step 11 does for WhatsApp. The paste-a-Google-Maps-link field is gone from the website (chat import still parses Maps links via `lib/geo/googleMapsLink.ts`): instead the browser's geolocation is requested only when the person taps "📍 Share my location", and the routes accept validated `latitude`/`longitude` (`lib/geo/zoneLookup.ts#parseCoordPair`). Confirmed rules: (1) permission denied / unsupported → the person picks their area from chips (zone centroid stored, as before); (2) **a location farther than the nearest zone's own `maxKm` is "outside all zones" and is NOT snapped to that zone** — the person picks an area, the true coordinate is still stored, and the record gets `internalNote: "location outside all zones — verify"`. Rule (2) lives in `lib/intake/persist.ts#resolveAreaAndCoords` and therefore applies to every intake path that supplies a precise coordinate (website and chat import alike) — it replaces the earlier "nearest zone, no cutoff" behavior, which could turn a far-away location into a same-zone hard-filter match (the Section 1 failure). Matching itself is unchanged and still zone-name-based (6.3).

## 8. API routes (Next.js App Router `app/api/...`)

- `POST /api/whatsapp/webhook` — inbound WhatsApp messages (Meta verification handshake + message handling)
- `POST /api/matching/run` — manually trigger matching for a given ParentRequest id (also called automatically after intake completes)
- `POST /api/payments/webhook` — JazzCash confirmation webhook
- `POST /api/ratings` — inbound star rating from a parent, updates Tutor.rating/ratingCount
- `GET/POST /api/marketing-spend` — CRUD for logging ad/referral spend
- `GET/POST /api/campaigns` — CRUD for campaigns (stores `metaAdId` for meta_ads channel campaigns)
- `POST /api/tutors/:id/attribute`, `POST /api/parents/:id/attribute` — manual campaignId tagging for non-Meta-ad leads (referrals, organic posts)
- `GET /api/campaigns/funnel` — computes the 6.10 funnel/A-B comparison table across all campaigns
- `GET /api/zones/tutor-density` — computes the 6.11 heat map aggregation, accepts optional `subjectGroup`/`tier` query params
- `GET /api/zones/student-density` — **2026-10-14**: student (parent request) counts per zone for the same map, optional `subjectGroup` and `needsTutor=1`; dashboard auth
- `GET /api/admin/exact-locations` — **2026-10-14**: admin-only exact-location dots (students + tutors who shared a precise location) for /heatmap; same filters plus `tier`
- `GET /api/opportunities` — public, unauthenticated. Returns open/unclaimed Match rows with `publishedToPageAt` set (6.5) — subject, subjectGroup, area, curriculum, `opportunityCode` only, never parent contact info
- `POST /api/opportunities/post-facebook-digest` — daily scheduled route (6.5), formats and posts the digest to the Facebook Page via the Graph API, records `SystemState["last_facebook_digest_posted_at"]` to avoid duplicate posts
- `GET /api/finance/metrics` — computes the 6.9 calculator output for a given date range/area
- `GET/POST /api/tutors`, `/api/parents`, `/api/matches`, `/api/zones` — CRUD backing the dashboard pages
- `GET/POST /api/subscriptions` — admin-only CRUD for `TutorSubscription` rows, driven by the `/tutors` dashboard form after the operator manually receives payment (6.5) — no tutor-facing write path, no payment gateway
- `POST /api/matches/check-notification-delay` — periodic route (called on a simple schedule, no queue service) that checks unclaimed opportunities past their free-tier delay window and triggers the free-tutor notification per 6.5 step 3
- `POST /api/public/parent-request`, `POST /api/public/tutor-apply` — **new, 2026-10-13 deviation (see Section 7)**: public, unauthenticated. Back the `/find-a-tutor` and `/become-a-tutor` web forms — same pipeline as every other intake path, no LLM call needed since the form already gives structured fields
- `GET/POST /api/website-content` — authenticated (staff), backs `/website-content`'s CMS editor

## 9. Environment variables

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=       // used for Storage uploads (6.1 step 10) — separate from
                             // DATABASE_URL, which is the Postgres connection string only
WHATSAPP_CLOUD_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
GROQ_API_KEY=
GEMINI_API_KEY=
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
COMMISSION_PERCENT=50
PREMIUM_NOTIFICATION_DELAY_MINUTES=60
RATING_REQUEST_DELAY_DAYS=30
FACEBOOK_PAGE_ACCESS_TOKEN=       // System User token, linked to the Page, doesn't expire
                                    // on the normal 60-day cycle — see 6.5
FACEBOOK_PAGE_ID=
ADMIN_WHATSAPP_NUMBER=
ADMIN_DASHBOARD_PASSWORD=
```

## 10. Build order (phases — build and verify each before moving on)

**Phase 0 — Prerequisites (operator task, not code)**: Meta Business verification and WhatsApp Cloud API number setup must exist before Phase 1 can be tested against real messages. Claude Code can scaffold the webhook contract ahead of this being ready, but should flag it as blocked for live testing until it's done.

**Phase 1 — Intake pipeline**: WhatsApp webhook receiving messages, LLM extraction working reliably, data landing correctly in `Tutor`/`ParentRequest` tables. Verify with real test messages before proceeding.

**Phase 2 — Matching + approval**: matching engine with hard filters and scoring, admin WhatsApp approval flow, ApprovalLog capturing corrections.

**Phase 3 — Parent-facing flow**: reply generation, parent selection, demo scheduling.

**Phase 4 — Payments**: payment link generation, webhook confirmation, commission calculation, manual payout marking.

**Phase 4.5 — Tutor tiers**: `TutorSubscription` as manual admin-entered records (no payment gateway — see 6.5), the `/tutors` dashboard form to create/renew them, the priority notification delay mechanism, and delivery-mode-aware matching for online requests. This phase has no dependency on Phase 4's JazzCash integration and can be built in parallel with or before it.

**Phase 5 — Dashboard polish**: all pages listed in section 7, in priority order (`/matches` and `/zones` matter most since they're the operator's daily tools and the direct fix for the area-mismatch problem, followed by `/finance` once there's enough real payment data for the calculator to be meaningful, then `/heatmap` and `/campaigns` together once there's enough tutor volume across more than one zone for the density comparison to be useful).

## 11. Brand positioning (for reply-generation prompt copy)

This is not just marketing color — it should directly shape the wording the LLM generates in 6.6 (parent replies) and in tutor-facing messages, so the pitch is consistent across every automated touchpoint, not just ads.

- **Niche, not generalist — updated for the expanded scope (Section 1).** The platform specializes in higher academic tiers: O-levels/A-levels, FSc/Intermediate (pre-medical, pre-engineering), Computer Science, Skills, and university-level tutoring — still never position it as "a tutor academy for everything" or imply Matric-level tutoring is covered. The differentiator against larger generalist competitors is verified, grade-backed specialization at these tiers, not breadth.
- **Grade-verified matching is now part of the pitch, not just a backend detail.** Since tutors self-report subject grades and matching now weighs subject-specific academic strength (6.3 Step 4), parent-facing copy can credibly say something like "matched with a tutor who's strong specifically in the subjects you need" — this is a real differentiator, not marketing filler.
- **Parent-facing pitch**: hyperlocal guarantee ("matched only with a tutor from your own area, guaranteed"), speed ("matched within hours, not days"), and curation ("a short list of vetted options, not an overwhelming directory"). Premium positioning, not cheapest-price positioning — do not generate copy that competes on being the lowest-cost option.
- **Tutor-facing pitch**: proximity is framed as a direct benefit to the tutor, not just an operational rule — "get matched with students close to you, save on travel time and fuel cost." This should appear in tutor onboarding messages, not just in the parent-facing pitch.
- **Explicit non-goal**: the business intentionally accepts a smaller, premium user base over a larger low-budget one. Prompts and templates should never soften or apologize for the price point, and should never imply the platform tries to serve every budget.

## 12. Explicit non-goals — do not build these

- No Make.com/Zapier/n8n or any workflow-automation SaaS
- No custom-trained ML model or neural network — matching is deterministic code, not machine learning
- No microservices, no message queue (Kafka/RabbitMQ/etc.), no separate backend service
- No multi-tenant auth system — single admin user is sufficient
- No automated tutor payout/disbursement integration in Phase 1 — manual transfer, logged in dashboard
- No LLM call that receives more than one profile's worth of data at a time
- No unofficial/third-party WhatsApp Status automation (Whapi.Cloud, Wassenger, or similar) — not supported by Meta's official Cloud API, risks the business's single WhatsApp number being banned, and is paid SaaS besides (6.5). Free tutors see opportunities via `/opportunities` instead.
- No WhatsApp Groups/Communities API automation — researched and rejected (6.5): capped at 8 participants per group, no bulk-send discount over 1:1 pricing, requires Official Business Account status and a paid invite-link template per member added. The manual copy-paste button on `/opportunities` covers this need at zero cost instead.
- No automated Instagram posting — Instagram has no text-only post type (an image/video is mandatory per post), and an auto-generated daily graphic risks looking spammy against the premium positioning (Section 11). Stays a manual, deliberate channel; only the Facebook Page digest (6.5) is automated.

## 13. Message templates and exact wording

These are the actual final strings for the touchpoints Section 2 reserves for operator sign-off. Keep the tone consistent with Section 11's brand positioning — premium, direct, courteous — never apologetic about price or scope.

**Tutor follow-up questions** (asked one at a time, only for the first missing field in `missingFields`, in this priority order):
- `name`: "Could you share your full name, please?"
- `area`: "Which area are you based in, or what's a nearby landmark?"
- `subjects`: "Which subject(s) do you teach?"
- `subjectGroup`: "Which category best fits — pre-medical, pre-engineering, computer science, skills/vocational, or university-level?"
- `curriculum`: "Which curriculum/level — O/A-levels, FSc/Intermediate, a specific degree program, or something else?"
- `qualification`: "What's your academic background/qualification?"
- `gradesBySubject`: "What grades did you get in the subjects you teach? (e.g. Biology: A, Chemistry: A-)"
- `availability`: "When are you generally available to teach — weekday mornings, afternoons, evenings, or weekends?"
(`expectedFee` is intentionally never force-asked — it's optional, per 6.3 Step 4's neutral-default handling. Only collect it if the tutor volunteers it. Email and phone are also never force-asked — only captured if volunteered.)

**Tutor — CNIC and marksheet request** (sent once the text fields above are complete — see 6.1 step 10):
> "Almost done! To verify your profile, please send a photo of your CNIC and your latest marksheet/transcript. This helps us confirm the grades you shared."

**Parent — "continue on WhatsApp vs. call" prompt** (sent when a required field beyond budget is missing, or the parent seems to prefer talking — see 6.1 step 5):
> "Thanks for sharing! I just need a couple more details to find the right match for you. You're welcome to continue here on WhatsApp, or if you'd prefer, I can have our team call you directly — just reply 'call me' anytime."

**Curriculum decline message** (sent only on a confirmed Matric/SSC match, never on an ambiguous one — see 6.1 step 7):
> "Thanks so much for reaching out! Right now we specialize in O/A-levels, FSc/Intermediate, and university-level tutoring, so we're not the best fit for a Matric-level requirement at the moment. Wishing you the best in finding the right tutor!"

**Demo slot offer** (sent once a parent selects a tutor — see 6.6):
> "Great choice! Here are a few times for your demo with [tutor name]: 1) [slot 1]  2) [slot 2]  3) [slot 3] — just reply with a number and we'll lock it in."

**Tutor opportunity notification** (sent per 6.5 — **premium tutors only**, immediately upon match approval; free tutors are never sent this via WhatsApp — see 6.5 for why):
> "A student near you is looking for a [subject] tutor ([curriculum], [area]). Are you available and interested? Reply YES to confirm, or NO if this doesn't work for you right now."

**Opportunity self-interest reply pattern** (from any tutor browsing `/opportunities`, 6.5 — not a bot-sent template, just what the bot should recognize in an inbound message): a message containing an `OPP-XXXX` code is parsed with a simple regex (no LLM call), linked to that `Match`, and treated as confirmed interest — same downstream handling as a premium tutor's YES reply above.

## 14. Success criteria

- A tutor and a parent can each complete intake entirely over WhatsApp with no operator intervention except approval.
- A parent in one area is never shown a tutor outside that area's `maxKm` radius — verified by the AreaZone hard filter, not by LLM judgment.
- Every match the operator approves/rejects is logged, so after a few months there's a reviewable dataset of real decisions.
- The operator can see, for any date range and area, actual cost per successful deal and actual profit per deal — not just revenue, so marketing spend decisions are made on real numbers.
- Premium tutors always get first, private notification of a matching opportunity; free tutors get zero paid WhatsApp pushes and instead rely on the public `/opportunities` page — verified by checking no template message is ever sent to a free-tier tutor for this purpose.
- A lapsed subscription correctly demotes a tutor to free-tier treatment on the very next match, not just at renewal time.
- A tutor's self-reported subject grades measurably affect their ranking for that subject, and no CNIC/marksheet image is ever sent through an LLM call — verification stays a manual, zero-marginal-cost glance for the operator.
- The operator can see, at a glance, which zones have the strongest tutor supply — without any per-tutor location data being exposed or any mapping API bill being incurred.
- Rating requests fire automatically and predictably (30 days post-payment), never ad hoc — so their WhatsApp template cost is forecastable per completed deal, not a variable the operator has to track manually.
- Infra cost stays at $0 under free tiers; WhatsApp messaging cost is small but real and forecastable (Section 1) — the `/finance` calculator (6.9) should reflect it once October 2026 rates are known, rather than the system silently assuming $0 forever.