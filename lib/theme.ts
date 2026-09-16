const THEME_KEY = "theme";

export function persistTheme(dark: boolean): void {
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {}
}