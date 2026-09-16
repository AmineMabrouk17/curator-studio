import { afterEach, describe, expect, it, vi } from "vitest";
import { persistTheme } from "./theme";

function installLocalStorage(): { store: Record<string, string> } {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  });
  return { store };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("persistTheme", () => {
  it("persists a light theme choice", () => {
    const { store } = installLocalStorage();
    persistTheme(false);
    expect(store.theme).toBe("light");
  });

  it("persists a dark theme choice", () => {
    const { store } = installLocalStorage();
    persistTheme(true);
    expect(store.theme).toBe("dark");
  });

  it("degrades to in-memory theming when setItem throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => persistTheme(true)).not.toThrow();
  });
});