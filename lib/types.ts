import type { Platform } from "./youtube";

export interface StudyDto {
  id: string;
  slug: string;
  title: string;
  videoUrl: string;
  platform: Platform;
  videoId: string | null;
  thumbnailUrl: string | null;
  content: string;
  tags: string[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}