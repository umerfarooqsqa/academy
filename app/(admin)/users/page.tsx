// /users — admin-only (middleware.ts). Create/manage dashboard accounts; the
// admin sets each user's password directly, no self-service signup (2026-10
// planning session, deliberately reversing CLAUDE.md Section 4/12's
// single-admin stance at the operator's direct request).

import { prisma } from "@/lib/db";
import { pageTitle } from "@/app/components/ui";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main>
      <h1 className={pageTitle}>Users</h1>
      <p className="mt-1 text-sm text-gray-500">
        Staff accounts get the day-to-day pages; admin accounts also get Payments, Finance,
        Campaigns, Marketing, and this page. You set each person's password directly — there's no
        self-service signup or password reset.
      </p>
      <div className="mt-4">
        <UsersClient users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))} />
      </div>
    </main>
  );
}
