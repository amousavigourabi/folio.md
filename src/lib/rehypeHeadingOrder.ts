import type { Element, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const MAX_HEADINGS = 10;

const rehypeHeadingOrder: Plugin<[], Root> = () => (tree, file) => {
  let prevLevel = 0;
  let count = 0;
  visit(tree, "element", (node: Element) => {
    const m = node.tagName.match(/^h([1-6])$/);
    if (!m) return;
    count++;
    const level = Number(m[1]);
    if (level > prevLevel + 1) {
      const from = prevLevel === 0 ? "document start" : `h${prevLevel}`;
      const text = hastToString(node).trim().slice(0, 60);
      console.warn(
        `[folio] ${file.path}: heading level skipped. "${text}" is h${level} but previous was ${from}`,
      );
    }
    prevLevel = level;
  });
  if (count > MAX_HEADINGS) {
    console.warn(
      `[folio] ${file.path}: ${count} headings found. Consider splitting this page.`,
    );
  }
};

export default rehypeHeadingOrder;
