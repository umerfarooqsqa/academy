import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const zones = await prisma.areaZone.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ zones });
}

// /zones is how the operator fixes the North Nazimabad/Malir class of problem
// directly, without touching code (Section 7).
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name || body.latitude == null || body.longitude == null) {
    return NextResponse.json({ error: "name, latitude, longitude are required" }, { status: 400 });
  }
  const zone = await prisma.areaZone.create({
    data: { name: body.name, latitude: body.latitude, longitude: body.longitude, maxKm: body.maxKm ?? 6 },
  });
  return NextResponse.json({ zone }, { status: 201 });
}
