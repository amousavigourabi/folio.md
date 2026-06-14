const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Returns the raw frontmatter block string, or null if none is found. */
export function parseFrontmatter(content: string): string | null {
  return FRONTMATTER_RE.exec(content)?.[1] ?? null;
}
