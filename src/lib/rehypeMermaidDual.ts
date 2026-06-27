import type { Element, ElementContent, Properties, Root } from "hast";
import rehypeMermaid from "rehype-mermaid";
import type { Plugin } from "unified";
import { unified } from "unified";
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
  width: "14",
  height: "14",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  ariaHidden: "true",
};

const lightProcessor = unified().use(rehypeMermaid, {
  mermaidConfig: { theme: "default" },
});
const darkProcessor = unified().use(rehypeMermaid, {
  mermaidConfig: { theme: "dark" },
});

/**
 * Renames every ID inside a Mermaid SVG and rewrites all references (url(#...),
 * href="#...", <style> text). Both renders produce the same internal IDs, so
 * without this the browser deduplicates them and dark arrows use light markers.
 *
 * The tree is isolated mermaid output, so we skip the SVG-guard pass and collect
 * all IDs directly, then rename in a second pass (two passes is the minimum since
 * a reference can appear before its target in the SVG).
 */
function sanitizeMermaidStyles(tree: Root) {
  visit(tree, "element", (node) => {
    const style = node.properties?.style;
    if (typeof style !== "string") return;
    const cleaned = style
      .split(";")
      .map((d) => d.trim())
      .filter((d) => {
        if (!d) return false;
        const colon = d.indexOf(":");
        if (colon === -1) return false;
        const prop = d.slice(0, colon).trim();
        const val = d.slice(colon + 1).trim();
        return prop && prop !== "undefined" && val && val !== "undefined";
      })
      .join("; ");
    node.properties ??= {};
    node.properties.style = cleaned || undefined;
  });
}

function fixSvgA11y(tree: Root) {
  visit(tree, "element", (node) => {
    if (node.tagName !== "svg") return;
    node.properties ??= {};
    node.properties.role = "img";
    if (!node.properties["aria-labelledby"]) {
      node.properties["aria-label"] =
        node.properties["aria-label"] ?? "Diagram";
    }
    node.properties["aria-roledescription"] = undefined;
  });
}

function renameMermaidIds(tree: Root, suffix: string) {
  const idMap = new Map<string, string>();

  visit(tree, "element", (node) => {
    const { id } = node.properties ?? {};
    if (typeof id === "string" && id) idMap.set(id, `${id}${suffix}`);
  });

  if (idMap.size === 0) return;

  const rewriteAttr = (val: string): string => {
    const urlMatch = val.match(/^url\(#(.+)\)$/);
    if (urlMatch?.[1] && idMap.has(urlMatch[1]))
      return `url(#${idMap.get(urlMatch[1])})`;
    if (val.startsWith("#") && idMap.has(val.slice(1)))
      return `#${idMap.get(val.slice(1))}`;
    return val;
  };

  const rewriteStyleText = (text: string): string => {
    let out = text;
    for (const [oldId, newId] of idMap)
      out = out.replaceAll(`#${oldId}`, `#${newId}`);
    return out;
  };

  visit(tree, "element", (node) => {
    node.properties ??= {};

    const { id } = node.properties;
    if (typeof id === "string" && idMap.has(id))
      node.properties.id = idMap.get(id);

    for (const key of Object.keys(node.properties)) {
      const val = node.properties[key];
      if (typeof val === "string") node.properties[key] = rewriteAttr(val);
    }

    if (node.tagName === "style") {
      const child = node.children[0];
      if (child?.type === "text") child.value = rewriteStyleText(child.value);
    }
  });
}

function isMermaidPre(el: Element): boolean {
  const code = el.children[0];
  return (
    el.tagName === "pre" &&
    code?.type === "element" &&
    Array.isArray(code.properties?.className) &&
    (code.properties.className as string[]).includes("language-mermaid")
  );
}

function makeZoomButton(): Element {
  // Build fresh icon nodes per call; a shared singleton would be mutated by
  // downstream hast passes and corrupt every button on the page simultaneously.
  const icon = h("svg", SVG, [
    h("path", { d: "M15 3h6v6" }),
    h("path", { d: "m21 3-7 7" }),
    h("path", { d: "m3 21 7-7" }),
    h("path", { d: "M9 21H3v-6" }),
  ]);
  return h(
    "button",
    {
      className: ["mermaid-zoom-btn"],
      type: "button",
      ariaLabel: "Enlarge diagram",
      title: "Enlarge diagram",
      "data-mermaid-zoom": true,
    },
    [icon],
  );
}

function makeWrapper(
  lightChildren: Root["children"],
  darkChildren: Root["children"],
): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["mermaid-dual"] },
    children: [
      makeZoomButton(),
      {
        type: "element",
        tagName: "div",
        properties: { className: ["mermaid-light"] },
        children: lightChildren as Element[],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["mermaid-dark"] },
        children: darkChildren as Element[],
      },
    ],
  };
}

const rehypeMermaidDual: Plugin<[], Root> = () => async (tree) => {
  const nodes: { node: Element; parent: Element | Root; index: number }[] = [];

  visit(tree, "element", (node, index, parent) => {
    if (isMermaidPre(node) && index != null) {
      nodes.push({ node, parent: parent as Element | Root, index });
    }
  });

  if (!nodes.length) return;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const { node, parent, index } = nodes[i];

    const [light, dark] = await Promise.all([
      lightProcessor.run({
        type: "root",
        children: [structuredClone(node)],
      } as Root),
      darkProcessor.run({ type: "root", children: [node] } as Root),
    ]);

    sanitizeMermaidStyles(light);
    sanitizeMermaidStyles(dark);
    fixSvgA11y(light);
    fixSvgA11y(dark);
    renameMermaidIds(light, "-light");
    renameMermaidIds(dark, "-dark");

    (parent.children as Element[]).splice(
      index,
      1,
      makeWrapper(light.children, dark.children),
    );
  }
};

export default rehypeMermaidDual;
