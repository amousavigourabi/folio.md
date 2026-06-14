import type { Element, Root } from "hast";
import { describe, expect, it } from "vitest";
import rehypeHeadingClasses from "./rehypeHeadingClasses";

function makeTree(...tagNames: string[]): Root {
  return {
    type: "root",
    children: tagNames.map((tagName) => ({
      type: "element" as const,
      tagName,
      properties: {},
      children: [{ type: "text" as const, value: "text" }],
    })),
  };
}

describe("rehypeHeadingClasses", () => {
  it("adds classes to h1 through h6", () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const tree = makeTree(`h${level}`);
      rehypeHeadingClasses()(tree);
      const el = tree.children[0] as Element;
      expect(el.properties.className).toEqual([
        "group",
        "mdx-heading",
        `mdx-h${level}`,
      ]);
    }
  });

  it("does not modify non-heading elements", () => {
    const tree = makeTree("p", "div", "span");
    rehypeHeadingClasses()(tree);
    for (const child of tree.children) {
      const el = child as Element;
      expect(el.properties.className).toBeUndefined();
    }
  });

  it("preserves existing classes and appends new ones", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h2",
          properties: { className: ["existing-class"] },
          children: [],
        },
      ],
    };
    rehypeHeadingClasses()(tree);
    const el = tree.children[0] as Element;
    expect(el.properties.className).toEqual([
      "existing-class",
      "group",
      "mdx-heading",
      "mdx-h2",
    ]);
  });

  it("does not touch elements nested inside headings", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h1",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "span",
              properties: {},
              children: [],
            },
          ],
        },
      ],
    };
    rehypeHeadingClasses()(tree);
    const span = (tree.children[0] as Element).children[0] as Element;
    expect(span.properties.className).toBeUndefined();
  });
});
