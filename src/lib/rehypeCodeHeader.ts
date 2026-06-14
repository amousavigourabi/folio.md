import type { Element, ElementContent, Node, Properties, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

function h(
  tagName: string,
  properties: Properties,
  children: ElementContent[] = [],
): Element {
  return { type: "element", tagName, properties, children };
}

const SVG: Properties = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "13",
  height: "13",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  ariaHidden: "true",
};

function isTitleFigcaption(node: Node): node is Element {
  return (
    node.type === "element" &&
    (node as Element).tagName === "figcaption" &&
    "data-rehype-pretty-code-title" in ((node as Element).properties ?? {})
  );
}

const rehypeCodeHeader: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "figure") return;
    const pre = node.children.find(
      (c): c is Element =>
        c.type === "element" &&
        c.tagName === "pre" &&
        typeof c.properties?.["data-language"] === "string",
    );
    if (!pre) return;

    // If rehype-pretty-code added a title figcaption, pull the filename from it
    // and remove the figcaption so we can render the filename in our own header.
    const titleIdx = node.children.findIndex(isTitleFigcaption);
    const filename =
      titleIdx !== -1 ? hastToString(node.children[titleIdx] as Element) : null;
    if (titleIdx !== -1) node.children.splice(titleIdx, 1);

    // Build fresh icon nodes per code block — module-level singletons would be
    // shared by reference across all blocks, so any downstream hast mutation
    // would corrupt every copy button on the page simultaneously.
    const copyIcon = h("svg", SVG, [
      h("rect", {
        width: "14",
        height: "14",
        x: "8",
        y: "8",
        rx: "2",
        ry: "2",
      }),
      h("path", {
        d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
      }),
    ]);
    const checkIcon = h("svg", SVG, [h("path", { d: "M20 6 9 17l-5-5" })]);

    const leftChildren: ElementContent[] = [
      h("span", { className: ["code-lang"] }, [
        { type: "text", value: pre.properties["data-language"] as string },
      ]),
    ];
    if (filename) {
      leftChildren.push(
        h("span", { className: ["code-filename"] }, [
          { type: "text", value: filename },
        ]),
      );
    }

    node.children.unshift(
      h("div", { className: ["code-header"] }, [
        h("div", { className: ["code-header-left"] }, leftChildren),
        h(
          "button",
          {
            className: ["copy-code-btn"],
            ariaLabel: "Copy code",
            type: "button",
            "data-code": hastToString(pre),
          },
          [
            h("span", { className: ["icon-copy"] }, [copyIcon]),
            h("span", { className: ["icon-check"] }, [checkIcon]),
            h("span", {
              className: ["sr-only"],
              ariaLive: "polite",
              ariaAtomic: "true",
            }),
          ],
        ),
      ]),
    );
  });
};

export default rehypeCodeHeader;
