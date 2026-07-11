import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

const rehypeCodeLanguage = () => (tree: Root) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "pre") return;
    const code = node.children.find(
      (child): child is Element =>
        child.type === "element" && child.tagName === "code",
    );
    if (!code) return;
    const classes = (code.properties?.className as string[] | undefined) ?? [];
    if (classes.some((c) => c.startsWith("language-"))) return;
    code.properties = {
      ...code.properties,
      className: [...classes, "language-text"],
    };
  });
};

export default rehypeCodeLanguage;
