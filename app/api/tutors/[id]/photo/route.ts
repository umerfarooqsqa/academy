// Staff-only (session-checked by middleware, like every /api/tutors route).
// Uploads a featured tutor's profile photo (2026-10-15) to the PUBLIC
// `tutor-photos` bucket — never the private `tutor-documents` bucket, which
// holds CNICs and marksheets. Only real JPEG/PNG/WebP images (checked by
// their first bytes, not just the declared type) up to 2 MB, so nothing else
// can ever be served from the public bucket.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PHOTO_BUCKET, uploadToSupabaseStorage } from "@/lib/storage/supabase";
import { sniffImageType } from "@/lib/storage/imageType";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tutor = await prisma.tutor.findUnique({ where: { id }, select: { id: true } });
  if (!tutor) return NextResponse.json({ error: "Tutor not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a photo first" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Photo must be 2 MB or smaller" }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) return NextResponse.json({ error: "Photo must be a JPEG, PNG or WebP image" }, { status: 400 });

  // A fresh name each time so browsers and the CDN never show a stale photo.
  const path = `${tutor.id}/${Date.now()}.${type.ext}`;
  const result = await uploadToSupabaseStorage(path, Buffer.from(bytes), type.mime, PHOTO_BUCKET);
  if (!result.ok || !result.publicUrl) {
    console.error(`[tutors/photo] upload failed for ${tutor.id}: ${result.error}`);
    return NextResponse.json({ error: "Upload failed — please try again" }, { status: 502 });
  }

  await prisma.tutor.update({ where: { id: tutor.id }, data: { profilePhotoUrl: result.publicUrl } });
  return NextResponse.json({ ok: true, profilePhotoUrl: result.publicUrl });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.tutor.update({ where: { id }, data: { profilePhotoUrl: null } });
  return NextResponse.json({ ok: true });
}
