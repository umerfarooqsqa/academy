import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth/passwords";
import { ensureInitialAdmin } from "@/lib/auth/bootstrap";
import { allowAttempt, clientIp, MINUTE } from "@/lib/security/rateLimit";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  // Brute-force brake (2026-10-15): 10 tries per 15 min per IP, and 5 per 15
  // min per email address — whoever is guessing, from wherever.
  const ipOk = await allowAttempt(`login-ip:${clientIp(req)}`, 10, 15 * MINUTE);
  const emailOk = email ? await allowAttempt(`login-email:${email}`, 5, 15 * MINUTE) : true;
  if (!ipOk || !emailOk) {
    return NextResponse.json({ error: "Too many login attempts — please wait 15 minutes and try again." }, { status: 429 });
  }

  // Idempotent — only ever does anything the very first time the User table is empty.
  await ensureInitialAdmin();

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || user.status !== "active" || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(user.id, user.role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
