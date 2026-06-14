import type { FolioConfig } from "@root/folio.config";
import { describe, expect, it } from "vitest";
import { articleSchema, breadcrumbSchema, websiteSchema } from "./schema";

const minConfig = {
  name: "Test Site",
  description: "A test site.",
  contentDir: "./docs",
  lang: "en",
  siteUrl: "https://example.com",
  light: { enabled: true, gradient: { from: "#fff", to: "#eee" } },
  dark: { enabled: false, gradient: { from: "#000", to: "#111" } },
  vale: { minErrorLevel: "error" as const },
  pagination: true,
} satisfies FolioConfig;

describe("websiteSchema", () => {
  it("includes url from siteUrl", () => {
    const s = websiteSchema(minConfig);
    expect(s.url).toBe("https://example.com");
  });
});

describe("articleSchema", () => {
  it("omits all optional fields when not provided, includes publisher url", () => {
    const s = articleSchema({
      title: "Hello",
      siteName: "Test Site",
      siteUrl: "https://example.com",
    });
    expect("description" in s).toBe(false);
    expect("datePublished" in s).toBe(false);
    expect("dateModified" in s).toBe(false);
    expect("author" in s).toBe(false);
    expect("image" in s).toBe(false);
    expect((s.publisher as { url: string }).url).toBe("https://example.com");
  });

  it("emits datePublished and dateModified as ISO strings", () => {
    const created = new Date("2024-01-01T00:00:00Z");
    const modified = new Date("2025-06-01T00:00:00Z");
    const s = articleSchema({
      title: "T",
      siteName: "S",
      datePublished: created,
      lastEdited: modified,
    });
    expect(s.datePublished).toBe("2024-01-01T00:00:00.000Z");
    expect(s.dateModified).toBe("2025-06-01T00:00:00.000Z");
  });

  it("emits author as Person node", () => {
    const s = articleSchema({ title: "T", siteName: "S", author: "Alice" });
    expect(s.author).toEqual({ "@type": "Person", name: "Alice" });
  });
});

describe("breadcrumbSchema", () => {
  it("maps crumbs to ListItem entries with correct positions", () => {
    const s = breadcrumbSchema(
      [{ label: "Guide", href: "/guide" }, { label: "Setup" }],
      "https://example.com",
    );
    expect(s["@type"]).toBe("BreadcrumbList");
    expect(s.itemListElement).toHaveLength(2);
    expect(s.itemListElement[0]).toMatchObject({
      position: 1,
      name: "Guide",
      item: "https://example.com/guide",
    });
    expect(s.itemListElement[1]).toMatchObject({ position: 2, name: "Setup" });
  });

  it("omits item for crumbs without href", () => {
    const s = breadcrumbSchema([{ label: "Leaf" }], "https://example.com");
    expect("item" in s.itemListElement[0]).toBe(false);
  });

  it("does not double-slash when siteUrl has trailing slash", () => {
    const s = breadcrumbSchema(
      [{ label: "Page", href: "/page" }],
      "https://example.com/",
    );
    expect(s.itemListElement[0].item).toBe("https://example.com/page");
  });
});
