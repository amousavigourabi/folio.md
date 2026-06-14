import type { Element, Root, Text } from "hast";
import { visit } from "unist-util-visit";

export default function rehypeTaskListWrap() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "li") return;
      const classes = node.properties.className as string[] | undefined;
      if (!classes?.includes("task-list-item")) return;

      const checkboxIdx = node.children.findIndex(
        (child) =>
          child.type === "element" && (child as Element).tagName === "input",
      );
      if (checkboxIdx === -1) return;

      const rest = node.children.slice(checkboxIdx + 1);
      // Drop the leading whitespace-only text node remark-gfm emits between the checkbox and the text.
      const content =
        rest.length > 0 &&
        rest[0].type === "text" &&
        (rest[0] as Text).value.trim() === ""
          ? rest.slice(1)
          : rest;

      node.children = [
        node.children[checkboxIdx],
        { type: "element", tagName: "span", properties: {}, children: content },
      ];
    });
  };
}
