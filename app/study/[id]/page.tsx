import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { isAuthenticated } from "@/lib/session";
import { serializeStudy } from "@/lib/studies";
import Navbar from "@/components/Navbar";
import Workspace from "@/components/Workspace";

export const metadata: Metadata = {
  title: "Study",
};

export default async function StudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/login?from=/study");

  const { id } = await params;
  const db = await getDb();
  const row = await db
    .select()
    .from(schema.studies)
    .where(eq(schema.studies.id, id))
    .get();

  if (!row) notFound();

  return (
    <>
      <Navbar />
      <Workspace key={row.id} study={serializeStudy(row)} />
    </>
  );
}