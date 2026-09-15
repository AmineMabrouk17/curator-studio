import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-5xl">🔍</span>
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
        Not found
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        This study doesn&apos;t exist or isn&apos;t public.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
      >
        Go home
      </Link>
    </main>
  );
}