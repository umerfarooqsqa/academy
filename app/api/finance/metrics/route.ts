// GET /api/finance/metrics — the 6.9 calculator (Section 8). Fetches raw rows
// and hands them to the pure lib/finance/calculator.ts function.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateFinanceMetrics } from "@/lib/finance/calculator";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const area = searchParams.get("area");

  const now = new Date();
  const start = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  // `end` is exclusive (DateRange contract) but a plain "YYYY-MM-DD" query param
  // means "through the end of that day" to whoever picked it in a date input —
  // parsed alone it's that day's UTC midnight, which would wrongly exclude the
  // entire day. Bump an explicit end param forward by one day so it's inclusive.
  const end = endParam
    ? new Date(new Date(endParam).getTime() + 24 * 60 * 60 * 1000)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [spend, payments] = await Promise.all([
    prisma.marketingSpend.findMany({ select: { amount: true, spentOn: true, area: true } }),
    prisma.payment.findMany({
      select: {
        status: true,
        commission: true,
        createdAt: true,
        match: { select: { parentRequest: { select: { area: true } } } },
      },
    }),
  ]);

  const paymentRows = payments.map((p) => ({
    status: p.status,
    commission: p.commission,
    createdAt: p.createdAt,
    area: p.match.parentRequest.area,
  }));

  const metrics = calculateFinanceMetrics(spend, paymentRows, { start, end }, area);
  return NextResponse.json({ metrics, range: { start, end }, area: area ?? null });
}
