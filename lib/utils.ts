import { formatTimestamp, parseTimestampToSeconds } from "./youtube";

export const SLUG_MAX_LENGTH = 80;

function truncateAtWordBoundary(slug: string): string {
  if (slug.length <= SLUG_MAX_LENGTH) return slug;
  const truncated = slug.slice(0, SLUG_MAX_LENGTH);
  const lastHyphen = truncated.lastIndexOf("-");
  return lastHyphen > 0 ? truncated.slice(0, lastHyphen) : truncated;
}

export function slugify(input: string): string {
  const slug = truncateAtWordBoundary(
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-"),
  );
  return slug || "study";
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((t) => String(t)).filter(Boolean);
    }
  } catch {
    // fall through
  }
  return [];
}

export function stringifyTags(tags: string[]): string {
  return JSON.stringify([...new Set(tags.map((t) => t.trim()).filter(Boolean))]);
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timestampFromMarkdown(match: string): number {
  return parseTimestampToSeconds(match.replace(/[\[\]]/g, ""));
}

export function timestampToMarkdown(seconds: number): string {
  return `[${formatTimestamp(seconds)}]`;
}

export const STRUCTURE_TEMPLATE = `## 🎯 Core Takeaway & Thesis

## 💡 AI Studio Discoveries & Deep Dive

## ✍️ My Commentary & Synthesis

## ⏱️ Key Timestamp Moments
`;