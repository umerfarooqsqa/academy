// GET/POST /api/subscriptions — admin-only CRUD for TutorSubscription rows,
// driven by the /tutors dashboard form after the operator manually receives
// payment (6.5). No tutor-facing write path, no payment gateway.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tutorId = searchParams.get("tutorId");
  const subscriptions = await prisma.tutorSubscription.findMany({
    where: tutorId ? { tutorId } : {},
    orderBy: { periodStart: "desc" },
  });
  return NextResponse.json({ subscriptions });
}

export async function POST(req: Request) {
  const body = await req.json();
  const required = ["tutorId", "amount", "periodStart", "periodEnd"];
  for (const f of required) {
    if (body[f] == null) return NextResponse.json({ error: `${f} is required` }, { status: 400 });
  }
  const subscription = await prisma.tutorSubscription.create({
    data: {
      tutorId: body.tutorId,
      status: body.status ?? "active",
      amount: body.amount,
      paymentMethod: body.paymentMethod ?? null,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
    },
  });
  return NextResponse.json({ subscription }, { status: 201 });
}
