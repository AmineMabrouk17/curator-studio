"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Moon, Sun } from "lucide-react";
import { persistTheme, getThemePreference } from "@/lib/theme";

function useTheme() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = getThemePreference();
    document.documentElement.classList.toggle("dark", isDark);
    requestAnimationFrame(() => {
      setDark(isDark);
      setMounted(true);
    });
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    persistTheme(next);
  };

  return { dark, toggle, mounted };
}

export default function Navbar() {
  const router = useRouter();
  const { dark, toggle, mounted } = useTheme();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center" aria-label="CuratorStudio home">
          <Image
            src="/brand/logo-dark-full.png"
            alt="CuratorStudio"
            width={905}
            height={212}
            priority
            unoptimized
            className="h-8 w-auto dark:hidden"
          />
          <Image
            src="/brand/logo-dark-panel.png"
            alt="CuratorStudio"
            width={768}
            height={303}
            priority
            unoptimized
            className="hidden h-8 w-auto dark:block"
          />
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            {mounted ? (
              dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4" /> // Placeholder while mounting to avoid SSR mismatch
            )}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}