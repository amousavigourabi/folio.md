import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const rehypeHeadingClasses: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node: Element) => {
    const m = node.tagName.match(/^h([1-6])$/);
    if (!m) return;
    const level = m[1];
    const existing = (node.properties.className as string[] | undefined) ?? [];
    node.properties.className = [
      ...existing,
      "group",
      "mdx-heading",
      `mdx-h${level}`,
    ];
  });
};

export default rehypeHeadingClasses;
