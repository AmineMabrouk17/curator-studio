import { describe, expect, it } from "vitest";
import { SLUG_MAX_LENGTH, slugify } from "./utils";

describe("slugify", () => {
  it("keeps slugs within the cap unchanged", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("A concise title")).toBe("a-concise-title");
  });

  it("truncates over-long slugs at a word boundary", () => {
    const title = `${"abcdefghij ".repeat(12).trim()}`;
    const expected = ["abcdefghij", "abcdefghij", "abcdefghij", "abcdefghij", "abcdefghij", "abcdefghij", "abcdefghij"].join("-");

    const slug = slugify(title);

    expect(slug).toBe(expected);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug.length).toBeLessThan(SLUG_MAX_LENGTH);
  });

  it("never ends mid-word, with no trailing or doubled hyphen from the cut", () => {
    const slug = slugify(`The Definitive Guide to Human Layer Orchestration for Agentic AI Workflows in the Enterprise and Beyond`);

    expect(slug.endsWith("-")).toBe(false);
    expect(slug.includes("--")).toBe(false);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
  });

  it("hard-cuts a single word longer than the cap (no boundary exists)", () => {
    const slug = slugify("a".repeat(SLUG_MAX_LENGTH + 1));

    expect(slug).toBe("a".repeat(SLUG_MAX_LENGTH));
  });

  it("keeps a dedupe-friendly shape so -2/-3 suffixes still apply", () => {
    const base = slugify("A long title that definitely exceeds eighty characters when fully sanitized down to kebab case");
    const deduped = `${base}-2`;

    expect(deduped.includes("--")).toBe(false);
    expect(base.endsWith("-")).toBe(false);
  });

  it("degrades to the study fallback when sanitisation empties the input", () => {
    expect(slugify("---")).toBe("study");
  });
});