// Local-only embedded Postgres for development/testing. NOT part of the
// deployed architecture — production still targets Supabase Postgres per
// CLAUDE.md Section 4. This exists purely so the app + Prisma migrations can be
// exercised end-to-end on this machine without Docker or a hosted DB.
//
// Usage: node scripts/test-db.mjs start   (prints DATABASE_URL, leaves it running)
//        node scripts/test-db.mjs stop

import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", ".testdb");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 55432,
  persistent: true,
});

const cmd = process.argv[2] ?? "start";

if (cmd === "start") {
  await pg.initialise().catch(() => {}); // no-op if already initialised
  await pg.start();
  try {
    await pg.createDatabase("tutor_matching");
  } catch {
    // already exists
  }
  console.log("DATABASE_URL=postgresql://postgres:postgres@localhost:55432/tutor_matching");
  console.log("Embedded test Postgres running. Ctrl+C to stop, or run: node scripts/test-db.mjs stop");
  // Keep the process alive.
  await new Promise(() => {});
} else if (cmd === "stop") {
  await pg.stop();
  console.log("stopped");
} else {
  console.error("Usage: node scripts/test-db.mjs [start|stop]");
  process.exit(1);
}
