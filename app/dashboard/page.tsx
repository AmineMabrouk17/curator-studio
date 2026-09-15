import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, desc, eq, like, or } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { isAuthenticated } from "@/lib/session";
import { parseTags } from "@/lib/utils";
import { serializeStudy } from "@/lib/studies";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

const VALID_PLATFORMS = new Set(["youtube", "x", "other"]);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; platform?: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/login?from=/dashboard");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";
  const platform = params.platform?.trim() ?? "";

  const db = await getDb();

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
  if (platform && VALID_PLATFORMS.has(platform)) {
    conditions.push(eq(schema.studies.platform, platform));
  }

  const [rows, allRows] = await Promise.all([
    db
      .select()
      .from(schema.studies)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.studies.updatedAt))
      .all(),
    db.select().from(schema.studies).all(),
  ]);

  const allTags = [...new Set(allRows.flatMap((r) => parseTags(r.tags)))].sort(
    (a, b) => a.localeCompare(b),
  );

  return (
    <>
      <Navbar />
      <Dashboard
        studies={rows.map(serializeStudy)}
        allTags={allTags}
        initialQuery={q}
        initialTag={tag}
        initialPlatform={platform}
      />
    </>
  );
}