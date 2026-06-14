/**
 * Converts arbitrary text to a URL-safe hyphenated slug.
 * Used by rehypeSlug (heading IDs) and validate-links (anchor checking)
 * so both are always in sync.
 *
 * Examples:
 *   "How to set up"                         → "how-to-set-up"
 *   "How to set everything up? And more..." → "how-to-set-everything-up-and-more"
 *   "Custom server / VPS"                   → "custom-server-vps"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD") // decompose accented chars (é → e + combining mark)
    .replace(/\p{Mn}/gu, "") // drop combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[\s_]/g, "-") // spaces/underscores → hyphens (before stripping other chars)
    .replace(/[^\w-]/g, "") // remove remaining punctuation, preserve hyphens as-is
    .replace(/-{2,}/g, "-") // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // trim any leading/trailing hyphens
}

/**
 * Converts a content collection entry ID (file path without extension) to a
 * URL slug, stripping any leading numeric ordering prefixes per path segment.
 *
 * Examples:
 *   "1.How to set up"           → "how-to-set-up"
 *   "01. Getting Started"       → "getting-started"
 *   "guide/02.Configuration"    → "guide/configuration"
 *   "index"                     → "index"  (caller maps this to "/")
 */
export function slugifyId(id: string): string {
  return id
    .split("/")
    .map((segment) => slugify(segment.replace(/^\d+[.\s-]+/, "").trim()))
    .join("/");
}
