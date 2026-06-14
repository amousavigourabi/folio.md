import type { Element, Root, Text } from "hast";
import { describe, expect, it } from "vitest";
import rehypeTaskListWrap from "./rehypeTaskListWrap";

function makeCheckbox(): Element {
  return {
    type: "element",
    tagName: "input",
    properties: { type: "checkbox" },
    children: [],
  };
}

function makeText(value: string): Text {
  return { type: "text", value };
}

function makeTaskItem(children: (Element | Text)[]): Element {
  return {
    type: "element",
    tagName: "li",
    properties: { className: ["task-list-item"] },
    children,
  };
}

function runPlugin(tree: Root): void {
  rehypeTaskListWrap()(tree);
}

describe("rehypeTaskListWrap", () => {
  it("wraps content after checkbox in a span", () => {
    const label = {
      type: "element" as const,
      tagName: "span",
      properties: {},
      children: [makeText("Do the thing")],
    };
    const tree: Root = {
      type: "root",
      children: [makeTaskItem([makeCheckbox(), label])],
    };
    runPlugin(tree);
    const li = tree.children[0] as Element;
    expect(li.children).toHaveLength(2);
    expect((li.children[0] as Element).tagName).toBe("input");
    const wrapper = li.children[1] as Element;
    expect(wrapper.tagName).toBe("span");
    expect(wrapper.children[0]).toMatchObject({ tagName: "span" });
  });

  it("drops the leading whitespace-only text node between checkbox and content", () => {
    const content = {
      type: "element" as const,
      tagName: "span",
      properties: {},
      children: [makeText("Do the thing")],
    };
    const tree: Root = {
      type: "root",
      children: [makeTaskItem([makeCheckbox(), makeText(" "), content])],
    };
    runPlugin(tree);
    const li = tree.children[0] as Element;
    const wrapper = li.children[1] as Element;
    // Whitespace text node should be gone; content should be first child of wrapper
    expect(wrapper.children).toHaveLength(1);
    expect((wrapper.children[0] as Element).tagName).toBe("span");
  });

  it("preserves non-whitespace text directly after checkbox", () => {
    const tree: Root = {
      type: "root",
      children: [makeTaskItem([makeCheckbox(), makeText("meaningful text")])],
    };
    runPlugin(tree);
    const li = tree.children[0] as Element;
    const wrapper = li.children[1] as Element;
    expect((wrapper.children[0] as Text).value).toBe("meaningful text");
  });

  it("does not modify non-task list items", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "li",
          properties: {},
          children: [makeText("plain item")],
        },
      ],
    };
    runPlugin(tree);
    const li = tree.children[0] as Element;
    expect(li.children).toHaveLength(1);
    expect((li.children[0] as Text).value).toBe("plain item");
  });
});
