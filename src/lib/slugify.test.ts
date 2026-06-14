import { describe, expect, it } from "vitest";
import { slugify, slugifyId } from "./slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("how to set up")).toBe("how-to-set-up");
  });

  it("replaces underscores with hyphens", () => {
    expect(slugify("some_thing")).toBe("some-thing");
  });

  it("removes punctuation but keeps hyphens", () => {
    expect(slugify("What? No!")).toBe("what-no");
    expect(slugify("How to set everything up? And more...")).toBe(
      "how-to-set-everything-up-and-more",
    );
  });

  it("collapses consecutive hyphens into one", () => {
    expect(slugify("foo  bar")).toBe("foo-bar"); // two spaces → one hyphen
    expect(slugify("foo---bar")).toBe("foo-bar"); // literal hyphens collapsed
    expect(slugify("Custom server / VPS")).toBe("custom-server-vps"); // spaces around / collapse
    expect(slugify("SEO & Metadata")).toBe("seo-metadata"); // & removed, surrounding hyphens collapse
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("preserves numbers", () => {
    expect(slugify("step 1 setup")).toBe("step-1-setup");
  });
});

describe("slugifyId", () => {
  it("strips leading numeric prefix with dot, space, or dash separator", () => {
    expect(slugifyId("01.Getting Started")).toBe("getting-started");
    expect(slugifyId("01. Getting Started")).toBe("getting-started");
    expect(slugifyId("01-Getting Started")).toBe("getting-started");
    expect(slugifyId("1.How to set up")).toBe("how-to-set-up");
  });

  it("strips prefix from each segment in a nested path", () => {
    expect(slugifyId("guide/02.Configuration")).toBe("guide/configuration");
  });

  it("preserves index as-is", () => {
    expect(slugifyId("index")).toBe("index");
  });

  it("is a no-op on paths without numeric prefixes", () => {
    expect(slugifyId("guide/getting-started")).toBe("guide/getting-started");
  });

  it("converts _section to 'section' — explaining why content.config.ts must special-case it", () => {
    expect(slugify("_section")).toBe("section");
    expect(slugifyId("guide/_section")).toBe("guide/section");
  });
});
