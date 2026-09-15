"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "boneyard-js/react";
import Image from "next/image";
import { Plus, Search, X } from "lucide-react";
import type { StudyDto } from "@/lib/types";
import type { Platform } from "@/lib/youtube";
import { cn } from "@/lib/cn";
import StudyCard from "./StudyCard";

interface DashboardProps {
  studies: StudyDto[];
  allTags: string[];
  initialQuery: string;
  initialTag: string;
  initialPlatform: string;
}

const PLATFORMS: Array<{ value: Platform | ""; label: string }> = [
  { value: "", label: "All platforms" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "other", label: "Other" },
];

export default function Dashboard({
  studies,
  allTags,
  initialQuery,
  initialTag,
  initialPlatform,
}: DashboardProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const firstRun = useRef(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (initialTag) params.set("tag", initialTag);
      if (initialPlatform) params.set("platform", initialPlatform);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/dashboard?${qs}` : "/dashboard");
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, initialTag, initialPlatform, router]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (key !== "tag" && initialTag) params.set("tag", initialTag);
    if (key !== "platform" && initialPlatform) params.set("platform", initialPlatform);
    if (value) params.set(key, value);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/dashboard?${qs}` : "/dashboard");
    });
  };

  const clearFilters = () =>
    startTransition(() => router.push("/dashboard"));

  const hasFilters = Boolean(initialQuery || initialTag || initialPlatform);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Library
        </h1>
        <span className="text-sm text-neutral-400 dark:text-neutral-500">
          {studies.length} {studies.length === 1 ? "study" : "studies"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/study/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            New Study
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, tag, or content…"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-8 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={initialPlatform}
          onChange={(e) => setFilter("platform", e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setFilter("tag", tag === initialTag ? "" : tag)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition",
                tag === initialTag
                  ? "bg-rose-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}

      <Skeleton
        name="dashboard-grid"
        loading={isPending}
        className="mt-6"
        fallback={<DashboardSkeletonCards />}
        fixture={<DashboardSkeletonCards />}
      >
        {studies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-900">
            <Image
              src="/brand/mark-black.png"
              alt=""
              width={106}
              height={152}
              className="h-7 w-auto dark:hidden"
            />
            <Image
              src="/brand/mark-white-on-dark.png"
              alt=""
              width={173}
              height={168}
              className="hidden h-8 w-auto rounded-xl dark:block"
            />
          </span>
            <p className="font-medium text-neutral-700 dark:text-neutral-300">
              {hasFilters ? "No studies match your filters" : "No studies yet"}
            </p>
            {!hasFilters && (
              <Link
                href="/study/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                <Plus className="h-4 w-4" />
                Create your first study
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {studies.map((study) => (
              <StudyCard
                key={study.id}
                study={study}
                onDeleted={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </Skeleton>
    </main>
  );
}

function DashboardSkeletonCards() {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800"
        >
          <div className="aspect-video bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-2 h-3 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}