import type { Root } from "hast";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import rehypeHeadingOrder from "./rehypeHeadingOrder";

function makeTree(...levels: number[]): Root {
  return {
    type: "root",
    children: levels.map((level, i) => {
      const line = 1 + i * 2;
      const text = `Heading ${level}`;
      const endCol = level + 1 + text.length + 1; // "#{level} {text}"
      return {
        type: "element" as const,
        tagName: `h${level}`,
        properties: {},
        children: [{ type: "text" as const, value: text }],
        position: {
          start: { line, column: 1, offset: i * 20 },
          end: { line, column: endCol, offset: i * 20 + endCol - 1 },
        },
      };
    }),
  };
}

const fakeFile = { path: "docs/test.mdx" } as never;

function run(tree: Root): void {
  rehypeHeadingOrder()(tree, fakeFile, () => {});
}

describe("rehypeHeadingOrder", () => {
  beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("emits no warning for a well-ordered shallow sequence", () => {
    run(makeTree(1, 2, 3));
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("emits no warning when going back up levels", () => {
    run(makeTree(1, 2, 3, 2, 3, 1, 2));
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("emits no warning for a single heading", () => {
    run(makeTree(1));
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("warns when the first heading is not h1", () => {
    run(makeTree(2));
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      `[folio] docs/test.mdx:1: heading level skipped, "Heading 2" is h2 but previous was document start.`,
    );
  });

  it("warns when jumping from h1 to h3", () => {
    run(makeTree(1, 3));
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      `[folio] docs/test.mdx:3: heading level skipped, "Heading 3" is h3 but previous was h1.`,
    );
  });

  it("warns for multiple independent skips", () => {
    // h1 → h3 (skip), h3 → h2 (ok), h2 → h4 (skip + depth warning)
    run(makeTree(1, 3, 2, 4));
    expect(console.warn).toHaveBeenCalledTimes(3);
  });

  it("ignores non-heading elements", () => {
    const tree: Root = {
      type: "root",
      children: [
        { type: "element", tagName: "h1", properties: {}, children: [] },
        { type: "element", tagName: "p", properties: {}, children: [] },
        { type: "element", tagName: "div", properties: {}, children: [] },
        { type: "element", tagName: "h2", properties: {}, children: [] },
      ],
    };
    run(tree);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("warns for h4 as deeply nested", () => {
    run(makeTree(1, 2, 3, 4));
    expect(console.warn).toHaveBeenCalledWith(
      `[folio] docs/test.mdx:7: deeply nested heading, "Heading 4" is #### (h4). Consider restructuring this section.`,
    );
  });

  it("warns for h5 as deeply nested", () => {
    run(makeTree(1, 2, 3, 4, 5));
    expect(console.warn).toHaveBeenCalledWith(
      `[folio] docs/test.mdx:7: deeply nested heading, "Heading 4" is #### (h4). Consider restructuring this section.`,
    );
    expect(console.warn).toHaveBeenCalledWith(
      `[folio] docs/test.mdx:9: deeply nested heading, "Heading 5" is ##### (h5). Consider restructuring this section.`,
    );
  });

  it("truncates long heading text to 60 characters in the warning", () => {
    const longText = "A".repeat(80);
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h1",
          properties: {},
          children: [{ type: "text", value: "Intro" }],
        },
        {
          type: "element",
          tagName: "h3",
          properties: {},
          children: [{ type: "text", value: longText }],
        },
      ],
    };
    run(tree);
    const warned = (console.warn as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(warned).toContain("A".repeat(60));
    expect(warned).not.toContain("A".repeat(61));
  });
});
