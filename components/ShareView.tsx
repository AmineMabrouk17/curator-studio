"use client";

import { useRef } from "react";
import type { ElementType } from "react";
import Image from "next/image";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { XBrandIcon, YouTubeIcon } from "./brand-icons";
import type { StudyDto } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/cn";
import VideoPlayer, { type VideoPlayerHandle } from "./VideoPlayer";
import MarkdownRenderer from "./MarkdownRenderer";

interface ShareViewProps {
  study: StudyDto;
}

const PLATFORM_META: Record<
  StudyDto["platform"],
  { label: string; icon: ElementType; classes: string }
> = {
  youtube: { label: "YouTube", icon: YouTubeIcon, classes: "text-red-600 dark:text-red-400" },
  x: { label: "X", icon: XBrandIcon, classes: "text-sky-600 dark:text-sky-400" },
  other: { label: "Link", icon: Link2, classes: "text-neutral-500 dark:text-neutral-400" },
};

export default function ShareView({ study }: ShareViewProps) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const canSeek = study.platform === "youtube" && Boolean(study.videoId);
  const meta = PLATFORM_META[study.platform];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold dark:bg-neutral-800",
              meta.classes,
            )}
          >
            <meta.icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Updated {formatDate(study.updatedAt)}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-100">
          {study.title}
        </h1>
        {study.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {study.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <VideoPlayer
              ref={playerRef}
              platform={study.platform}
              videoId={study.videoId}
              videoUrl={study.videoUrl}
            />
            {canSeek && (
              <p className="mt-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
                Click a timestamp in the notes to jump to that moment.
              </p>
            )}
          </div>
        </div>
        <div className="lg:col-span-3">
          <article className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-950">
            {study.content ? (
              <MarkdownRenderer
                content={study.content}
                onTimestampClick={canSeek ? (s) => playerRef.current?.seekTo(s) : undefined}
              />
            ) : (
              <p className="text-neutral-400 dark:text-neutral-500">
                This study has no notes yet.
              </p>
            )}
          </article>
        </div>
      </div>

      <footer className="mt-12 flex items-center justify-center gap-2 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link href="/" className="flex items-center gap-2 text-neutral-400 transition hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
          <Image
            src="/brand/mark-accent.png"
            alt=""
            width={102}
            height={148}
            className="h-5 w-auto"
          />
          <span className="text-sm font-medium">CuratorStudio</span>
        </Link>
      </footer>
    </main>
  );
}