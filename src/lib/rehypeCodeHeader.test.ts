import type { Element, Root, Text } from "hast";
import { describe, expect, it } from "vitest";
import rehypeCodeHeader from "./rehypeCodeHeader";

function makeCodeFigure(language: string, code: string): Element {
  return {
    type: "element",
    tagName: "figure",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "pre",
        properties: { "data-language": language },
        children: [
          {
            type: "element",
            tagName: "code",
            properties: {},
            children: [{ type: "text", value: code }],
          },
        ],
      },
    ],
  };
}

function runAndGetHeader(language: string, code: string): Element {
  const tree: Root = {
    type: "root",
    children: [makeCodeFigure(language, code)],
  };
  rehypeCodeHeader()(tree);
  return (tree.children[0] as Element).children[0] as Element;
}

describe("rehypeCodeHeader", () => {
  it("prepends a .code-header div with a language label and copy button", () => {
    const header = runAndGetHeader("python", "print('hi')");
    expect(header.tagName).toBe("div");
    expect(header.properties.className).toContain("code-header");

    const left = header.children.find(
      (c) =>
        c.type === "element" &&
        (c as Element).properties.className
          ?.toString()
          .includes("code-header-left"),
    ) as Element;
    const lang = left.children.find(
      (c) =>
        c.type === "element" &&
        (c as Element).properties.className?.toString().includes("code-lang"),
    ) as Element;
    expect((lang.children[0] as Text).value).toBe("python");

    const btn = header.children.find(
      (c) => c.type === "element" && (c as Element).tagName === "button",
    ) as Element;
    expect(btn.properties["data-code"]).toBe("print('hi')");
  });

  it("does not modify figures without a language-tagged pre", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "figure",
          properties: {},
          children: [
            { type: "element", tagName: "pre", properties: {}, children: [] },
          ],
        },
      ],
    };
    rehypeCodeHeader()(tree);
    expect((tree.children[0] as Element).children).toHaveLength(1);
  });

  it("produces independent icon nodes for each code block", () => {
    const tree: Root = {
      type: "root",
      children: [makeCodeFigure("ts", "a"), makeCodeFigure("ts", "b")],
    };
    rehypeCodeHeader()(tree);
    const getBtn = (figureIdx: number) => {
      const header = (tree.children[figureIdx] as Element)
        .children[0] as Element;
      return header.children.find(
        (c) => c.type === "element" && (c as Element).tagName === "button",
      ) as Element;
    };
    const copyIcon1 = (getBtn(0).children[0] as Element).children[0];
    const copyIcon2 = (getBtn(1).children[0] as Element).children[0];
    expect(copyIcon1).not.toBe(copyIcon2);
  });
});
