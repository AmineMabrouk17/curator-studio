"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ElementType } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "boneyard-js/react";
import { ArrowRight, Link2 } from "lucide-react";
import { detectPlatform, extractYouTubeId, extractTweetId, getYouTubeThumbnail } from "@/lib/youtube";
import { XBrandIcon, YouTubeIcon } from "./brand-icons";
import TagInput from "./TagInput";
import { cn } from "@/lib/cn";

interface PlatformLabel {
  label: string;
  icon: ElementType;
  classes: string;
}

function ThumbnailPreview({
  thumbnail,
  platformLabel,
}: {
  thumbnail: string;
  platformLabel: PlatformLabel;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    const img = new window.Image();
    img.src = thumbnail;
    const markLoaded = () => setLoaded(true);
    if (img.complete) {
      markLoaded();
    } else {
      img.onload = markLoaded;
      img.onerror = markLoaded; // Avoid staying stuck if image fails
    }
  }, [thumbnail]);

  return (
    <Skeleton
      name="new-study-preview"
      loading={!loaded}
      fallback={
        <div className="flex aspect-video w-full items-center gap-3 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex h-full w-1/2 animate-pulse items-center justify-center bg-neutral-200 dark:bg-neutral-800">
            <platformLabel.icon className={cn("h-5 w-5", platformLabel.classes)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="h-5 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      }
      fixture={
        <div className="flex aspect-video w-full items-center gap-3 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex h-full w-1/2 items-center justify-center bg-neutral-200 dark:bg-neutral-800" />
          <div className="min-w-0 flex-1" />
        </div>
      }
    >
      <div className="flex aspect-video w-full items-center gap-3 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={thumbnail}
          alt=""
          onLoad={() => setLoaded(true)}
          className="h-full w-1/2 object-cover"
        />
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold dark:bg-neutral-800",
              platformLabel.classes,
            )}
          >
            <platformLabel.icon className="h-3 w-3" />
            {platformLabel.label}
          </span>
        </div>
      </div>
    </Skeleton>
  );
}

export default function NewStudyForm() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [xThumbnail, setXThumbnail] = useState<string | null>(null);

  const trimmedUrl = videoUrl.trim();
  const platform = useMemo(() => detectPlatform(trimmedUrl), [trimmedUrl]);
  const youtubeId = useMemo(() => extractYouTubeId(trimmedUrl), [trimmedUrl]);
  const tweetId = useMemo(() => extractTweetId(trimmedUrl), [trimmedUrl]);

  // Dynamically fetch X thumbnail when an X URL is entered
  useEffect(() => {
    if (platform === "x" && tweetId) {
      fetch(`https://api.fxtwitter.com/status/${tweetId}`)
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as {
            tweet?: {
              media?: {
                videos?: Array<{ thumbnail_url?: string }>;
                photos?: Array<{ url?: string }>;
              };
            };
          };
          const media = data?.tweet?.media;
          const found = media?.videos?.[0]?.thumbnail_url || media?.photos?.[0]?.url;
          if (found) setXThumbnail(found);
        })
        .catch(() => {});
      return;
    }
    setXThumbnail(null);
  }, [platform, tweetId]);

  const thumbnail = youtubeId ? getYouTubeThumbnail(youtubeId) : xThumbnail;

  const platformLabel = {
    youtube: { label: "YouTube", icon: YouTubeIcon, classes: "text-red-600 dark:text-red-400" },
    x: { label: "X (Twitter)", icon: XBrandIcon, classes: "text-sky-600 dark:text-sky-400" },
    other: { label: "External link", icon: Link2, classes: "text-neutral-500 dark:text-neutral-400" },
  }[platform];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!trimmedUrl) {
      setError("Paste a video URL to get started.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/studies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          videoUrl: trimmedUrl,
          title: title.trim() || undefined,
          tags,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create the study.");
        setLoading(false);
        return;
      }
      router.push(`/study/${data.id}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          New Study
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Paste a YouTube, X (Twitter), or any video URL to start a new study.
        </p>
      </div>

      {platform === "other" && trimmedUrl && !thumbnail && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          This looks like a generic video link. It will be saved as an open-link card
          — timestamps won&apos;t be interactive for it.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Video URL *
          </span>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=… or https://x.com/…"
            className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>

        {trimmedUrl &&
          (thumbnail ? (
            <ThumbnailPreview key={thumbnail} thumbnail={thumbnail} platformLabel={platformLabel} />
          ) : (
            <div className="flex items-center gap-3 overflow-hidden rounded-lg border border-neutral-200 px-3 py-3 dark:border-neutral-800">
              <platformLabel.icon className={cn("h-5 w-5 shrink-0", platformLabel.classes)} />
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold dark:bg-neutral-800",
                    platformLabel.classes,
                  )}
                >
                  <platformLabel.icon className="h-3 w-3" />
                  {platformLabel.label}
                </span>
              </div>
            </div>
          ))}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is this study about?"
            className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Tags
          </span>
          <TagInput tags={tags} onChange={setTags} />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !trimmedUrl}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          Create Study
          {loading ? null : <ArrowRight className="h-4 w-4" />}
        </button>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}