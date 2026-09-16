"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ExternalLink, Link2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "boneyard-js/react";
import { getTweetEmbedUrl, type Platform } from "@/lib/youtube";
import { XBrandIcon, YouTubeIcon } from "./brand-icons";

export type VideoPlayerHandle = {
  seekTo(seconds: number): void;
  getCurrentTime(): number;
  canSeek: boolean;
};

const EMBED_TIMEOUT_MS = 8000;

interface YouTubePlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  getCurrentTime(): number;
  destroy(): void;
}

interface YouTubeApi {
  Player: new (
    container: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number>;
      events: { onReady: () => void; onError?: () => void };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const script = document.createElement("script");
      script.id = "yt-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
  return ytApiPromise;
}

interface VideoPlayerProps {
  platform: Platform;
  videoId: string | null;
  videoUrl?: string;
  thumbnailUrl?: string | null;
  startTime?: number;
  autoplay?: boolean;
  onSeekRequested?: (seconds: number) => void;
  onDegradedChange?: (degraded: boolean) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    {
      platform,
      videoId,
      videoUrl,
      thumbnailUrl,
      startTime,
      autoplay,
      onDegradedChange,
    }: VideoPlayerProps,
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YouTubePlayer | null>(null);
    const currentTimeRef = useRef(0);
    const [ready, setReady] = useState(false);
    const [degraded, setDegraded] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    const canEmbed =
      platform === "youtube" && Boolean(videoId);

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        if (!canEmbed || degraded) return;
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(seconds, true);
          playerRef.current.playVideo?.();
        }
      },
      getCurrentTime() {
        if (!canEmbed || degraded) return currentTimeRef.current;
        if (playerRef.current?.getCurrentTime) {
          currentTimeRef.current = playerRef.current.getCurrentTime();
        }
        return currentTimeRef.current;
      },
      canSeek: canEmbed && !degraded,
    }));

    useEffect(() => {
      setReady(false);
      setDegraded(false);
    }, [videoId, platform]);

    useEffect(() => {
      if (canEmbed && !ready && !degraded) {
        const timer = setTimeout(() => setDegraded(true), EMBED_TIMEOUT_MS);
        return () => clearTimeout(timer);
      }
    }, [canEmbed, ready, degraded]);

    useEffect(() => {
      onDegradedChange?.(degraded);
    }, [degraded, onDegradedChange]);

    useEffect(() => {
      if (!canEmbed || !videoId) return;
      let player: YouTubePlayer | null = null;
      let cancelled = false;

      loadYouTubeApi().then(() => {
        if (cancelled || !containerRef.current) return;
        const YT = window.YT;
        if (!YT) return;
        try {
          player = new YT.Player(containerRef.current, {
            videoId,
            playerVars: {
              rel: 0,
              playsinline: 1,
              autoplay: autoplay ? 1 : 0,
            },
            events: {
              onReady: () => {
                playerRef.current = player;
                setReady(true);
                setDegraded(false);
                if (startTime && player?.seekTo) {
                  player.seekTo(startTime, true);
                }
              },
              onError: () => {
                if (!cancelled) setDegraded(true);
              },
            },
          });
        } catch {
          if (!cancelled) setDegraded(true);
        }
      });

      return () => {
        cancelled = true;
        try {
          player?.destroy();
        } catch {
          // already destroyed
        }
        playerRef.current = null;
      };
    }, [canEmbed, videoId, startTime, autoplay, retryKey]);

    const asyncLoading = !ready && !degraded && Boolean(videoId);

    const watchUrl =
      videoUrl ||
      (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined);

    const retry = () => {
      ytApiPromise = null;
      document.getElementById("yt-iframe-api")?.remove();
      setDegraded(false);
      setRetryKey((k) => k + 1);
    };

    return (
      <Skeleton
        name="video-player"
        loading={asyncLoading}
        fallback={
          <div className="flex aspect-video w-full animate-pulse items-center justify-center rounded-xl bg-neutral-200 dark:bg-neutral-800">
            {platform === "x" ? (
              <XBrandIcon className="h-10 w-10 text-neutral-400 dark:text-neutral-600" />
            ) : (
              <YouTubeIcon className="h-10 w-10 text-neutral-400 dark:text-neutral-600" />
            )}
          </div>
        }
        fixture={
          <div className="aspect-video w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        }
      >
        {platform === "youtube" && videoId ? (
          degraded ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900 dark:border-neutral-800">
              {thumbnailUrl && (
                <Image
                  src={thumbnailUrl}
                  alt="YouTube thumbnail"
                  fill
                  sizes="100vw"
                  unoptimized
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 p-4">
                {watchUrl && (
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Watch on YouTube
                  </a>
                )}
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <div ref={containerRef} className="absolute inset-0 h-full w-full" />
            </div>
          )
        ) : platform === "x" && videoId ? (
          <div className="w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
            <iframe
              src={getTweetEmbedUrl(videoId)}
              onLoad={() => setReady(true)}
              className="w-full min-h-64 border-0"
              title="Tweet embed"
              allow="autoplay; encrypted-media"
              loading="lazy"
            />
          </div>
        ) : (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {platform === "x" ? (
              <XBrandIcon className="h-10 w-10" />
            ) : platform === "youtube" ? (
              <YouTubeIcon className="h-10 w-10" />
            ) : (
              <Link2 className="h-10 w-10" />
            )}
            <span className="text-sm font-medium">Open video</span>
          </a>
        )}
      </Skeleton>
    );
  },
);

export default VideoPlayer;