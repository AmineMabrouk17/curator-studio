"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { StudyDto } from "@/lib/types";
import { formatTimestamp } from "@/lib/youtube";
import { cn } from "@/lib/cn";
import VideoPlayer, { type VideoPlayerHandle } from "./VideoPlayer";
import MarkdownEditor, { type MarkdownEditorHandle } from "./MarkdownEditor";
import MarkdownRenderer from "./MarkdownRenderer";
import TagInput from "./TagInput";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type ViewMode = "edit" | "split" | "preview";

interface WorkspaceProps {
  study: StudyDto;
}

export default function Workspace({ study }: WorkspaceProps) {
  const [title, setTitle] = useState(study.title);
  const [content, setContent] = useState(study.content);
  const [tags, setTags] = useState(study.tags);
  const [isPublic, setIsPublic] = useState(study.isPublic);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>("split");

  const playerRef = useRef<VideoPlayerHandle>(null);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const firstRun = useRef(true);
  const latestDraft = useRef({ title, content, tags, isPublic });

  useEffect(() => {
    latestDraft.current = { title, content, tags, isPublic };
  });

  const canSeek = study.platform === "youtube" && Boolean(study.videoId);
  const shareUrl = `${window.location.origin}/share/${study.slug}`;

  const save = useCallback(async () => {
    const draft = latestDraft.current;
    setStatus("saving");
    try {
      const res = await fetch(`/api/studies/${study.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }, [study.id]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setStatus("idle");
    const timer = setTimeout(save, 1500);
    return () => clearTimeout(timer);
  }, [title, content, tags, isPublic, save]);

  useEffect(() => () => {
    void save();
  }, [save]);

  const captureTimestamp = () => {
    if (!canSeek) return;
    const seconds = playerRef.current?.getCurrentTime() ?? 0;
    editorRef.current?.insertAtCursor(`[${formatTimestamp(seconds)}]`);
  };

  const onPreviewTimestampClick = (seconds: number) => {
    if (canSeek) playerRef.current?.seekTo(seconds);
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 sm:px-6">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Study title"
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-600"
        />

        <span
          className={cn(
            "flex h-6 items-center gap-1.5 text-xs font-medium",
            status === "saving" && "text-neutral-400",
            status === "saved" && "text-emerald-600 dark:text-emerald-400",
            status === "error" && "text-red-600 dark:text-red-400",
          )}
        >
          {status === "saving" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          )}
          {status === "saved" && (
            <>
              <Check className="h-3.5 w-3.5" /> Saved
            </>
          )}
          {status === "error" && "Save failed"}
        </span>

        <button
          type="button"
          onClick={() => setIsPublic((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition",
            isPublic
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800",
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          {isPublic ? "Public" : "Private"}
        </button>

        <button
          type="button"
          disabled={!isPublic}
          onClick={copyShareLink}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
            isPublic
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800",
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy Share Link"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 grid-cols-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6 lg:grid lg:grid-cols-2 lg:overflow-hidden">
        <div className="flex min-h-0 flex-col gap-4">
          <VideoPlayer
            ref={playerRef}
            platform={study.platform}
            videoId={study.videoId}
            videoUrl={study.videoUrl}
          />

          <div className="flex flex-wrap items-center gap-2">
            {canSeek && (
              <button
                type="button"
                onClick={captureTimestamp}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                <Sparkles className="h-4 w-4" />
                Capture Timestamp
              </button>
            )}
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Google AI Studio
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(study.videoUrl)}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Copy className="h-4 w-4" />
              Copy Video URL
            </button>
          </div>

          <TagInput tags={tags} onChange={setTags} placeholder="Add tags to organize this study…" />
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 dark:border-neutral-800 dark:bg-neutral-900 lg:hidden">
            {(["edit", "split", "preview"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition",
                  view === mode
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
                )}
              >
                {mode === "split" ? "Split" : mode}
              </button>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
            <div
              className={cn(
                "flex min-h-0 flex-col",
                view === "preview" ? "hidden md:flex" : "flex",
              )}
            >
              <MarkdownEditor
                ref={editorRef}
                value={content}
                onChange={setContent}
                onCapture={canSeek ? captureTimestamp : undefined}
              />
            </div>
            <div
              className={cn(
                "flex min-h-0 flex-col overflow-y-auto",
                view === "edit" ? "hidden md:flex" : "flex",
              )}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Preview
                </span>
                {canSeek && (
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    Click a timestamp to seek
                  </span>
                )}
              </div>
              <MarkdownRenderer
                content={content}
                onTimestampClick={canSeek ? onPreviewTimestampClick : undefined}
                className="flex-1 p-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}