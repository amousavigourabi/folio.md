import type { Element, Root } from "hast";
import { describe, expect, it } from "vitest";
import rehypeCodeLanguage from "./rehypeCodeLanguage";

const fakeFile = {} as never;

function makeBlock(className?: string): Root {
  const code: Element = {
    type: "element",
    tagName: "code",
    properties: className ? { className: [className] } : {},
    children: [{ type: "text", value: "const x = 1;" }],
  };
  return {
    type: "root",
    children: [
      { type: "element", tagName: "pre", properties: {}, children: [code] },
    ],
  };
}

function getCodeClasses(tree: Root): string[] {
  const pre = tree.children[0] as Element;
  const code = pre.children[0] as Element;
  return (code.properties?.className as string[] | undefined) ?? [];
}

function run(tree: Root): void {
  rehypeCodeLanguage()(tree, fakeFile, () => {});
}

describe("rehypeCodeLanguage", () => {
  it("does not modify a block that already has a language class", () => {
    for (const lang of [
      "language-ts",
      "language-bash",
      "language-python",
      "language-yaml",
    ]) {
      const tree = makeBlock(lang);
      run(tree);
      expect(getCodeClasses(tree)).toEqual([lang]);
    }
  });

  it("adds language-text when no className is present", () => {
    const tree = makeBlock();
    run(tree);
    expect(getCodeClasses(tree)).toContain("language-text");
  });

  it("adds language-text when className has no language- entry", () => {
    const tree = makeBlock("some-other-class");
    run(tree);
    const classes = getCodeClasses(tree);
    expect(classes).toContain("language-text");
    expect(classes).toContain("some-other-class");
  });

  it("converts multiple unlanguaged blocks in one tree", () => {
    const makeCode = (): Element => ({
      type: "element",
      tagName: "code",
      properties: {},
      children: [],
    });
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "pre",
          properties: {},
          children: [makeCode()],
        },
        {
          type: "element",
          tagName: "pre",
          properties: {},
          children: [makeCode()],
        },
      ],
    };
    run(tree);
    for (const pre of tree.children as Element[]) {
      const code = pre.children[0] as Element;
      expect((code.properties?.className as string[]) ?? []).toContain(
        "language-text",
      );
    }
  });

  it("does not modify a pre without a code child", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "pre",
          properties: {},
          children: [
            { type: "element", tagName: "span", properties: {}, children: [] },
          ],
        },
      ],
    };
    run(tree);
    const pre = tree.children[0] as Element;
    const span = pre.children[0] as Element;
    expect(span.properties?.className).toBeUndefined();
  });

  it("ignores inline code elements (no pre wrapper)", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "code",
          properties: {},
          children: [{ type: "text", value: "inline" }],
        },
      ],
    };
    run(tree);
    const code = tree.children[0] as Element;
    expect(
      (code.properties?.className as string[] | undefined) ?? [],
    ).not.toContain("language-text");
  });
});
