import { NextResponse } from "next/server";
import { and, desc, eq, like, or } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { readSession } from "@/lib/auth";
import { generateId, slugify, stringifyTags } from "@/lib/utils";
import { parseVideo, getTweetThumbnail } from "@/lib/youtube";
import { serializeStudy } from "@/lib/studies";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!(await readSession(request))) return unauthorized();

  const db = await getDb();
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const tag = url.searchParams.get("tag")?.trim() ?? "";
  const platform = url.searchParams.get("platform")?.trim() ?? "";

  const conditions = [];
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        like(schema.studies.title, pattern),
        like(schema.studies.tags, pattern),
        like(schema.studies.content, pattern),
      ),
    );
  }
  if (tag) {
    conditions.push(like(schema.studies.tags, `%${JSON.stringify(tag)}%`));
  }
  if (platform) {
    conditions.push(eq(schema.studies.platform, platform));
  }

  const rows = await db
    .select()
    .from(schema.studies)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.studies.updatedAt))
    .all();

  return NextResponse.json(rows.map(serializeStudy));
}

export async function POST(request: Request) {
  if (!(await readSession(request))) return unauthorized();
  const db = await getDb();

  let body: { title?: string; videoUrl?: string; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const videoUrl = body.videoUrl?.trim();
  if (!videoUrl) {
    return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
  }

  const title = body.title?.trim() || "Untitled Study";
  const tags = stringifyTags(body.tags ?? []);
  const parsed = parseVideo(videoUrl);

  let thumbnailUrl = parsed.thumbnailUrl;
  if (!thumbnailUrl && parsed.platform === "x" && parsed.videoId) {
    thumbnailUrl = await getTweetThumbnail(parsed.videoId);
  }

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const existing = await db
      .select({ id: schema.studies.id })
      .from(schema.studies)
      .where(eq(schema.studies.slug, slug))
      .get();
    if (!existing) break;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const now = new Date();
  const study = {
    id: generateId(),
    slug,
    title,
    videoUrl,
    platform: parsed.platform,
    videoId: parsed.videoId,
    thumbnailUrl,
    content: "",
    tags,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.studies).values(study);
  return NextResponse.json(serializeStudy(study), { status: 201 });
}