import type { Element, Root } from "hast";
import { describe, expect, it } from "vitest";
import rehypeSlug from "./rehypeSlug";

function makeHeading(
  level: number,
  text: string,
  existingId?: string,
): Element {
  return {
    type: "element",
    tagName: `h${level}`,
    properties: existingId ? { id: existingId } : {},
    children: [{ type: "text", value: text }],
  };
}

function run(tree: Root): void {
  rehypeSlug()(tree);
}

describe("rehypeSlug", () => {
  it("adds a slugified id derived from heading text", () => {
    const tree: Root = {
      type: "root",
      children: [makeHeading(1, "Hello World")],
    };
    run(tree);
    expect((tree.children[0] as Element).properties.id).toBe("hello-world");
  });

  it("deduplicates repeated heading text with a numeric suffix", () => {
    const tree: Root = {
      type: "root",
      children: [
        makeHeading(2, "Intro"),
        makeHeading(2, "Intro"),
        makeHeading(2, "Intro"),
      ],
    };
    run(tree);
    expect((tree.children[0] as Element).properties.id).toBe("intro");
    expect((tree.children[1] as Element).properties.id).toBe("intro-1");
    expect((tree.children[2] as Element).properties.id).toBe("intro-2");
  });

  it("skips headings that already have an id", () => {
    const tree: Root = {
      type: "root",
      children: [makeHeading(1, "Hello", "my-custom-id")],
    };
    run(tree);
    expect((tree.children[0] as Element).properties.id).toBe("my-custom-id");
  });

  it("ignores non-heading elements", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "text" }],
        },
      ],
    };
    run(tree);
    expect((tree.children[0] as Element).properties.id).toBeUndefined();
  });

  it("handles all heading levels h1–h6", () => {
    const tree: Root = {
      type: "root",
      children: [1, 2, 3, 4, 5, 6].map((n) => makeHeading(n, `Heading ${n}`)),
    };
    run(tree);
    for (let i = 0; i < 6; i++) {
      expect((tree.children[i] as Element).properties.id).toBe(
        `heading-${i + 1}`,
      );
    }
  });
});
