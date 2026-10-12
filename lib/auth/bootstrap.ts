// One-time first-admin bootstrap (multi-user accounts, 2026-10 planning
// session). Retiring the old shared ADMIN_DASHBOARD_PASSWORD meant there had
// to be a way to get a first account into an empty User table without a
// manual script step to forget. Called at the top of the login route on every
// attempt — cheap (one count query) and fully idempotent: once any User row
// exists, this is permanently a no-op.

import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { hashPassword } from "@/lib/auth/passwords";

export async function ensureInitialAdmin(): Promise<void> {
  const count = await prisma.user.count();
  if (count > 0) return;

  const { email, password } = config.initialAdmin;
  if (!email || !password) {
    console.warn("[auth] User table is empty and INITIAL_ADMIN_EMAIL/INITIAL_ADMIN_PASSWORD aren't set — no one can log in yet.");
    return;
  }

  await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), role: "admin", status: "active" },
  });
  console.info(`[auth] Bootstrapped the first admin account: ${email}`);
}
