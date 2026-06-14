import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./parseFrontmatter";
import { slugifyId } from "./slugify";

export function buildRedirects(dir: string): Record<string, string> {
  if (!existsSync(dir)) return {};
  const out: Record<string, string> = {};
  function scan(current: string) {
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      if (statSync(full).isDirectory()) {
        scan(full);
        continue;
      }
      if (!/\.(md|mdx)$/.test(entry)) continue;
      let src: string;
      try {
        src = readFileSync(full, "utf8");
      } catch {
        continue;
      }
      const fm = parseFrontmatter(src);
      if (!fm) continue;
      const aliasMatch = fm.match(/^alias:\s*(.+)$/m);
      if (!aliasMatch) continue;
      const slug = slugifyId(path.relative(dir, full).replace(/\.[^.]+$/, ""));
      out[slug === "index" ? "/" : `/${slug}`] = aliasMatch[1].trim();
    }
  }
  scan(dir);
  return out;
}
