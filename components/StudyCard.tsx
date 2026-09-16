"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Skeleton } from "boneyard-js/react";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { Platform } from "@/lib/youtube";
import type { StudyDto } from "@/lib/types";
import { XBrandIcon, YouTubeIcon } from "./brand-icons";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/copy";
import { formatDate } from "@/lib/utils";

function PlatformBadge({ platform }: { platform: Platform }) {
  const config = {
    youtube: { label: "YouTube", icon: YouTubeIcon, classes: "text-red-600 dark:text-red-400" },
    x: { label: "X", icon: XBrandIcon, classes: "text-sky-600 dark:text-sky-400" },
    other: { label: "Link", icon: Link2, classes: "text-neutral-500 dark:text-neutral-400" },
  }[platform];

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
      <config.icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

interface StudyCardProps {
  study: StudyDto;
  onDeleted?: () => void;
}

type CopyState = "idle" | "copied" | "failed";

export default function StudyCard({ study, onDeleted }: StudyCardProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [deleting, setDeleting] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (imgRef.current?.complete) setImgLoaded(true);
  }, []);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${study.slug}`
      : `/share/${study.slug}`;

  const copyShareLink = async () => {
    const ok = await copyText(shareUrl);
    setCopyState(ok ? "copied" : "failed");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1500);
  };

  const deleteStudy = async () => {
    if (deleting) return;
    if (!window.confirm(`Delete "${study.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/studies/${study.id}`, { method: "DELETE" });
    onDeleted?.();
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950">
      <Link href={`/study/${study.id}`} className="relative block aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        {study.thumbnailUrl ? (
          <Skeleton
            name="study-card-thumbnail"
            loading={!imgLoaded}
            className="block aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900"
            fallback={
              <div className="h-full w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
            }
            fixture={
              // eslint-disable-next-line @next/next/no-img-element
              <img src={study.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={study.thumbnailUrl}
              alt=""
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          </Skeleton>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900">
            {study.platform === "youtube" && <YouTubeIcon className="h-10 w-10 text-neutral-500" />}
            {study.platform === "x" && <XBrandIcon className="h-10 w-10 text-neutral-500" />}
            {study.platform === "other" && <Link2 className="h-10 w-10 text-neutral-500" />}
          </div>
        )}
        <div className="absolute left-2 top-2">
          <PlatformBadge platform={study.platform} />
        </div>
        <div
          className={cn(
            "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur",
            study.isPublic
              ? "bg-emerald-500/90 text-white"
              : "bg-neutral-700/80 text-neutral-200",
          )}
        >
          {study.isPublic ? "Public" : "Private"}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/study/${study.id}`}
          className="line-clamp-2 font-semibold text-neutral-900 transition hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400"
        >
          {study.title}
        </Link>

        {study.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {study.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Updated {formatDate(study.updatedAt)}
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/study/${study.id}`}
              aria-label="Edit"
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              aria-live="polite"
              aria-label={
                copyState === "copied"
                  ? "Copied!"
                  : copyState === "failed"
                    ? "Failed to copy"
                    : "Copy share link"
              }
              title={study.isPublic ? "Copy share link" : "Publish to get a share link"}
              disabled={!study.isPublic}
              onClick={copyShareLink}
              className={cn(
                "flex h-8 items-center justify-center gap-1 rounded-md transition enabled:hover:bg-neutral-100 enabled:hover:text-neutral-700 disabled:opacity-40 dark:enabled:hover:bg-neutral-800 dark:enabled:hover:text-neutral-200",
                copyState === "idle" && "px-1 text-neutral-400",
                copyState === "copied" && "text-emerald-600 dark:text-emerald-400",
                copyState === "failed" && "text-red-600 dark:text-red-400",
              )}
            >
              {copyState === "copied" ? (
                <Check className="h-4 w-4" />
              ) : copyState === "failed" ? (
                <X className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copyState !== "idle" && (
                <span className="text-xs font-medium">
                  {copyState === "copied" ? "Copied!" : "Failed to copy"}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label="Delete"
              disabled={deleting}
              onClick={deleteStudy}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {study.thumbnailUrl && !study.isPublic && (
        <div className="sr-only">
          <ExternalLink className="h-4 w-4" />
          {shareUrl}
        </div>
      )}
    </div>
  );
}