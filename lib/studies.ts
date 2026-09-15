import { parseTags } from "./utils";
import type { StudyDto } from "./types";

export type StudyRow = {
  id: string;
  slug: string;
  title: string;
  videoUrl: string;
  platform: string;
  videoId: string | null;
  thumbnailUrl: string | null;
  content: string;
  tags: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeStudy(row: StudyRow): StudyDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    videoUrl: row.videoUrl,
    platform: row.platform as StudyDto["platform"],
    videoId: row.videoId,
    thumbnailUrl: row.thumbnailUrl,
    content: row.content,
    tags: parseTags(row.tags),
    isPublic: row.isPublic,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}