"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const from = searchParams.get("from");
        router.push(from && !from.startsWith("/api/") ? from : "/dashboard");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Incorrect password");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/brand/logo-light-panel.png"
          alt="CuratorStudio"
          width={768}
          height={303}
          priority
          className="h-16 w-auto dark:hidden"
        />
        <Image
          src="/brand/logo-dark-panel.png"
          alt="CuratorStudio"
          width={768}
          height={303}
          priority
          className="hidden h-16 w-auto dark:block"
        />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          This studio is private. Enter your curator password to continue.
        </p>
      </div>

      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Enter Studio
      </button>
    </form>
  );
}