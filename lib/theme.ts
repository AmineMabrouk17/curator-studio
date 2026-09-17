export const THEME_KEY = "theme";

export function getThemePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function persistTheme(dark: boolean): void {
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {}
}