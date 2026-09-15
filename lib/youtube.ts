export type Platform = "youtube" | "x" | "other";

export interface ParsedVideo {
  platform: Platform;
  videoId: string | null;
  thumbnailUrl: string | null;
  startTime?: number;
}

export function detectPlatform(url: string): Platform {
  if (!url) return "other";
  const host = safeUrl(url)?.hostname ?? "";
  if (/(^|\.)youtube\.com$|^youtu\.be$|(^|\.)youtube-nocookie\.com$/.test(host)) {
    return "youtube";
  }
  if (/(^|\.)x\.com$|(^|\.)twitter\.com$/.test(host)) {
    return "x";
  }
  return "other";
}

function safeUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function extractYouTubeId(url: string): string | null {
  const parsed = safeUrl(url);
  if (!parsed) return null;

  if (parsed.hostname === "youtu.be") {
    const id = parsed.pathname.replace("/", "");
    return id.length > 0 ? id : null;
  }

  const pathMatch = parsed.pathname.match(
    /\/(?:embed|v|shorts|live)\/([A-Za-z0-9_-]{11})/,
  );
  if (pathMatch) return pathMatch[1];

  const watch = parsed.searchParams.get("v");
  if (watch && /^[A-Za-z0-9_-]{11}$/.test(watch)) return watch;

  return null;
}

export function extractTweetId(url: string): string | null {
  const parsed = safeUrl(url);
  if (!parsed) return null;
  const match = parsed.pathname.match(/\/status\/(\d{1,20})/);
  return match ? match[1] : null;
}

export function parseYouTubeStartTime(url: string): number | undefined {
  const parsed = safeUrl(url);
  if (!parsed) return undefined;
  const raw = parsed.searchParams.get("t") ?? parsed.searchParams.get("start");
  if (!raw) return undefined;
  return parseTimestampToSeconds(raw);
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({ rel: "0", playsinline: "1" });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function getTweetEmbedUrl(tweetId: string): string {
  return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
}

export function parseTimestampToSeconds(input: string): number {
  const trimmed = input.trim();
  const parts = trimmed.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function formatTimestamp(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export const TIMESTAMP_RE = /\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/g;

export function parseVideo(url: string): ParsedVideo {
  const platform = detectPlatform(url);
  if (platform === "youtube") {
    const videoId = extractYouTubeId(url);
    return {
      platform,
      videoId,
      thumbnailUrl: videoId ? getYouTubeThumbnail(videoId) : null,
      startTime: parseYouTubeStartTime(url),
    };
  }
  if (platform === "x") {
    return { platform, videoId: extractTweetId(url), thumbnailUrl: null };
  }
  return { platform, videoId: null, thumbnailUrl: null };
}