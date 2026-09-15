import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { readSession } from "@/lib/auth";
import { stringifyTags } from "@/lib/utils";
import { parseVideo } from "@/lib/youtube";
import { serializeStudy } from "@/lib/studies";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: RouteContext) {
  if (!(await readSession(request))) return unauthorized();
  const { id } = await ctx.params;
  const db = await getDb();
  const row = await db
    .select()
    .from(schema.studies)
    .where(eq(schema.studies.id, id))
    .get();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeStudy(row));
}

export async function PUT(request: Request, ctx: RouteContext) {
  if (!(await readSession(request))) return unauthorized();
  const { id } = await ctx.params;
  const db = await getDb();

  let body: {
    title?: string;
    content?: string;
    tags?: string[];
    isPublic?: boolean;
    videoUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(schema.studies)
    .where(eq(schema.studies.id, id))
    .get();
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated: Partial<typeof schema.studies.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    updated.title = title;
  }
  if (body.content !== undefined) updated.content = body.content;
  if (body.tags !== undefined) updated.tags = stringifyTags(body.tags);
  if (body.isPublic !== undefined) updated.isPublic = Boolean(body.isPublic);
  if (body.videoUrl !== undefined && body.videoUrl.trim()) {
    const parsed = parseVideo(body.videoUrl.trim());
    updated.videoUrl = body.videoUrl.trim();
    updated.platform = parsed.platform;
    updated.videoId = parsed.videoId;
    updated.thumbnailUrl = parsed.thumbnailUrl ?? existing.thumbnailUrl;
  }

  await db.update(schema.studies).set(updated).where(eq(schema.studies.id, id));

  const row = await db
    .select()
    .from(schema.studies)
    .where(eq(schema.studies.id, id))
    .get();
  return NextResponse.json(serializeStudy(row!));
}

export async function DELETE(request: Request, ctx: RouteContext) {
  if (!(await readSession(request))) return unauthorized();
  const { id } = await ctx.params;
  const db = await getDb();
  await db.delete(schema.studies).where(eq(schema.studies.id, id));
  return NextResponse.json({ ok: true });
}