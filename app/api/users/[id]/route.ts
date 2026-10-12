// PATCH /api/users/:id — admin-only. Change role, enable/disable, or set a new
// password (admin-set only — no self-service "change my password" flow,
// 2026-10 planning session; an admin can reset their own password here too).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/passwords";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.role === "admin" || body.role === "staff") data.role = body.role;
  if (body.status === "active" || body.status === "disabled") data.status = body.status;
  if (typeof body.password === "string" && body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.password);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No recognised fields provided" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });
  return NextResponse.json({ user });
}
