import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { serializeStudy } from "@/lib/studies";
import { parseTags } from "@/lib/utils";
import ShareView from "@/components/ShareView";

export const dynamic = "force-dynamic";

async function getPublicStudy(slug: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.studies)
    .where(
      and(eq(schema.studies.slug, slug), eq(schema.studies.isPublic, true)),
    )
    .get();
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPublicStudy(slug);
  if (!row) return { title: "Not found" };
  const title = row.title;
  const description = parseTags(row.tags).length
    ? `A CuratorStudio study tagged ${parseTags(row.tags)
        .map((t) => `#${t}`)
        .join(", ")}.`
    : "A CuratorStudio study.";
  const meta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: row.thumbnailUrl ? [row.thumbnailUrl] : undefined,
    },
  };
  return meta;
}

export default async function SharePage({ params }: Props) {
  const { slug } = await params;
  const row = await getPublicStudy(slug);
  if (!row) notFound();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50 dark:bg-neutral-900">
      <ShareView study={serializeStudy(row)} />
    </div>
  );
}