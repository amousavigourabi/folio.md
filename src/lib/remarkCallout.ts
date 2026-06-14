import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Supported callout types and their display labels
const CALLOUT_TYPES = {
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  danger: "Danger",
} as const;

type CalloutType = keyof typeof CALLOUT_TYPES;

function isCalloutType(name: string): name is CalloutType {
  return name in CALLOUT_TYPES;
}

/**
 * Transforms :::note / :::tip / :::warning / :::danger container directives
 * (from remark-directive) into <aside> elements with data-callout attributes
 * so CSS can style them by type.
 *
 * Usage in MDX/MD:
 *   :::note
 *   This is a note.
 *   :::
 */
const remarkCallout: Plugin<[], Root> = () => (tree) => {
  visit(tree, "containerDirective", (node) => {
    if (!isCalloutType(node.name)) return;

    const type = node.name;
    const label = CALLOUT_TYPES[type];

    // Inject data attributes onto the directive node so rehype renders it as
    // <section data-callout="note"> (remark-directive maps the node to <section>)
    node.data ??= {};
    node.data.hName = "aside";
    node.data.hProperties = {
      "data-callout": type,
      ...(node.data.hProperties as object | undefined),
    };

    // Prepend a title element as the first child
    node.children.unshift({
      type: "paragraph",
      data: {
        hName: "p",
        hProperties: { className: ["callout-title"] },
      },
      children: [{ type: "text", value: label }],
    });
  });
};

export default remarkCallout;
