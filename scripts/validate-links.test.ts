import { describe, expect, it } from "vitest";
import {
  checkInternal,
  extractHeadings,
  extractLinks,
  processPool,
} from "./validate-links-utils";

describe("checkInternal", () => {
  const slugs = new Set([
    "index",
    "guide/getting-started",
    "guide/configuration",
    "about",
  ]);
  const headings = new Map<string, Set<string>>([
    [
      "guide/getting-started",
      new Set(["prerequisites", "install", "next-steps"]),
    ],
    ["about", new Set(["our-team"])],
    ["index", new Set()],
  ]);

  it("accepts known pages and '/' as index", () => {
    expect(checkInternal("/", slugs)).toBe(true);
    expect(checkInternal("/guide/getting-started", slugs)).toBe(true);
  });

  it("rejects unknown pages", () => {
    expect(checkInternal("/does-not-exist", slugs)).toBe(false);
    expect(checkInternal("/guide/missing", slugs)).toBe(false);
  });

  describe("with fragment on a cross-page link", () => {
    it("accepts a known heading anchor", () => {
      expect(
        checkInternal("/guide/getting-started#install", slugs, headings),
      ).toBe(true);
    });

    it("rejects a non-existent or wrong-page anchor", () => {
      expect(
        checkInternal("/guide/getting-started#ghost", slugs, headings),
      ).toBe(false);
      expect(checkInternal("/about#prerequisites", slugs, headings)).toBe(
        false,
      );
    });

    it("passes when the page has no heading data (graceful fallback)", () => {
      expect(
        checkInternal("/guide/configuration#anything", slugs, headings),
      ).toBe(true);
    });

    it("rejects unknown page regardless of fragment", () => {
      expect(checkInternal("/no-such-page#install", slugs, headings)).toBe(
        false,
      );
    });

    it("passes without a headingMap (backwards compatible)", () => {
      expect(checkInternal("/guide/getting-started#ghost", slugs)).toBe(true);
    });
  });

  describe("with a pure fragment link (#heading)", () => {
    it("validates against the current page's headings", () => {
      expect(
        checkInternal("#install", slugs, headings, "guide/getting-started"),
      ).toBe(true);
      expect(
        checkInternal("#ghost", slugs, headings, "guide/getting-started"),
      ).toBe(false);
    });

    it("passes when headingMap or currentSlug are absent", () => {
      expect(checkInternal("#anything", slugs)).toBe(true);
      expect(checkInternal("#anything", slugs, headings)).toBe(true);
    });
  });
});

describe("extractHeadings", () => {
  it("extracts all heading levels and slugifies the text", () => {
    expect(
      extractHeadings("# Hello World\n\n## Getting Started\n\n### Sub Section"),
    ).toEqual(["hello-world", "getting-started", "sub-section"]);
  });

  it("collects text from inline code and emphasis", () => {
    expect(extractHeadings("## Install `bun`")).toContain("install-bun");
    expect(extractHeadings("## Why *folio* works")).toContain(
      "why-folio-works",
    );
  });
});

describe("extractLinks", () => {
  it("extracts inline links and deduplicates", () => {
    const links = extractLinks(
      "[A](/page) [B](/page) [C](https://example.com)",
    );
    expect(links).toEqual(["/page", "https://example.com"]);
  });

  it("extracts links from GFM tables and autolinks", () => {
    expect(extractLinks("| [link](/table-page) |")).toContain("/table-page");
    expect(extractLinks("Visit https://example.com")).toContain(
      "https://example.com",
    );
  });

  it("does not include image srcs", () => {
    expect(extractLinks("![alt](/image.png)")).not.toContain("/image.png");
  });

  it("does not extract reference-style links", () => {
    // remark emits [text][ref] as `linkReference`, not `link` — out of scope
    expect(extractLinks("See [docs][d].\n\n[d]: /guide")).not.toContain(
      "/guide",
    );
  });
});

describe("processPool", () => {
  it("processes all items", async () => {
    const results: number[] = [];
    await processPool([1, 2, 3], 2, async (n) => {
      results.push(n);
    });
    expect(results.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("handles an empty array without error", async () => {
    await processPool([], 4, async () => {});
  });

  it("never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let maxSeen = 0;
    await processPool([1, 2, 3, 4, 5], 2, async () => {
      inFlight++;
      maxSeen = Math.max(maxSeen, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--;
    });
    expect(maxSeen).toBeLessThanOrEqual(2);
  });
});
