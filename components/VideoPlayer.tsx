"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Link2 } from "lucide-react";
import { Skeleton } from "boneyard-js/react";
import { getTweetEmbedUrl, type Platform } from "@/lib/youtube";
import { XBrandIcon, YouTubeIcon } from "./brand-icons";

export type VideoPlayerHandle = {
  seekTo(seconds: number): void;
  getCurrentTime(): number;
  canSeek: boolean;
};

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
      events: { onReady: () => void };
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
  startTime?: number;
  autoplay?: boolean;
  onSeekRequested?: (seconds: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    { platform, videoId, videoUrl, startTime, autoplay }: VideoPlayerProps,
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YouTubePlayer | null>(null);
    const currentTimeRef = useRef(0);
    const canSeek = platform === "youtube" && Boolean(videoId);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      setReady(false);
    }, [videoId, platform]);

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        if (canSeek && playerRef.current?.seekTo) {
          playerRef.current.seekTo(seconds, true);
          playerRef.current.playVideo?.();
        }
      },
      getCurrentTime() {
        if (canSeek && playerRef.current?.getCurrentTime) {
          currentTimeRef.current = playerRef.current.getCurrentTime();
        }
        return currentTimeRef.current;
      },
      canSeek,
    }));

    useEffect(() => {
      if (!canSeek || !videoId) return;
      let player: YouTubePlayer | null = null;
      let cancelled = false;

      loadYouTubeApi().then(() => {
        if (cancelled || !containerRef.current) return;
        const YT = window.YT;
        if (!YT) return;
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
              if (startTime && player?.seekTo) {
                player.seekTo(startTime, true);
              }
            },
          },
        });
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
    }, [canSeek, videoId, startTime, autoplay]);

    const asyncLoading =
      !ready &&
      !!((platform === "youtube" && videoId) || (platform === "x" && videoId));

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
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <div ref={containerRef} className="absolute inset-0 h-full w-full" />
          </div>
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