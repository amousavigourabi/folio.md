import type { Element, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { slugify } from "./slugify";

const rehypeSlug: Plugin<[], Root> = () => (tree) => {
  const seen = new Map<string, number>();
  visit(tree, "element", (node: Element) => {
    if (!/^h[1-6]$/.test(node.tagName) || node.properties.id) return;
    const base = slugify(hastToString(node));
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    node.properties.id = count === 0 ? base : `${base}-${count}`;
  });
};

export default rehypeSlug;
