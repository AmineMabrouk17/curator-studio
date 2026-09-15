import { integer, index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const studies = sqliteTable(
  "studies",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    videoUrl: text("video_url").notNull(),
    platform: text("platform").notNull(),
    videoId: text("video_id"),
    thumbnailUrl: text("thumbnail_url"),
    content: text("content").notNull().default(""),
    tags: text("tags").notNull().default("[]"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("idx_studies_slug").on(t.slug),
    index("idx_studies_public").on(t.isPublic),
  ],
);

export const loginAttempts = sqliteTable("login_attempts", {
  ip: text("ip").primaryKey(),
  failed: integer("failed").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
});

export type Study = typeof studies.$inferSelect;
export type NewStudy = typeof studies.$inferInsert;