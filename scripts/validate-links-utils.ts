import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { slugify } from "../src/lib/slugify";

type AnyNode = { type: string; value?: string; children?: AnyNode[] };

function collectText(node: AnyNode): string {
  if (node.type === "text" || node.type === "inlineCode")
    return node.value ?? "";
  return (node.children ?? []).map(collectText).join("");
}

export function extractLinks(content: string): string[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);
  const links: string[] = [];
  visit(tree, "link", (node) => links.push((node as { url: string }).url));
  return [...new Set(links)];
}

export function extractHeadings(content: string): string[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);
  const headings: string[] = [];
  visit(tree, "heading", (node) => {
    const text = collectText(node as AnyNode);
    const slug = slugify(text);
    if (slug) headings.push(slug);
  });
  return headings;
}

export function checkInternal(
  href: string,
  slugSet: Set<string>,
  headingMap?: Map<string, Set<string>>,
  currentSlug?: string,
): boolean {
  const hashIdx = href.indexOf("#");
  const bare = hashIdx === -1 ? href : href.slice(0, hashIdx);
  const fragment = hashIdx === -1 ? undefined : href.slice(hashIdx + 1);

  if (!bare) {
    // Pure fragment link — validate against the current page's headings
    if (!fragment || !headingMap || !currentSlug) return true;
    const pageHeadings = headingMap.get(currentSlug);
    return pageHeadings ? pageHeadings.has(fragment) : true;
  }

  const slug = bare === "/" ? "index" : bare.replace(/^\//, "");
  if (!slugSet.has(slug)) return false;

  if (fragment && headingMap) {
    const pageHeadings = headingMap.get(slug);
    // If we have heading data for this page, validate the fragment
    if (pageHeadings) return pageHeadings.has(fragment);
  }

  return true;
}

export async function processPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}
