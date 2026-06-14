import fs from "node:fs/promises";
import path from "node:path";
import { globby } from "globby";
import { parseFrontmatter } from "../src/lib/parseFrontmatter";
import { slugifyId } from "../src/lib/slugify";
import {
  checkInternal,
  extractHeadings,
  extractLinks,
  processPool,
} from "./validate-links-utils";

const ROOT = process.cwd();
const CONCURRENCY = 10;
const TIMEOUT_MS = 8000;

const contentDir = process.env.FOLIO_CONTENT_DIR
  ? path.resolve(process.env.FOLIO_CONTENT_DIR)
  : path.join(ROOT, "src/content/docs");

async function checkExternal(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "docs-link-checker/1.0" },
    });
    // Some servers reject HEAD; fall back to GET
    if (res.status === 405) {
      const res2 = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "User-Agent": "docs-link-checker/1.0" },
      });
      return res2.ok;
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const files = await globby(["**/*.{md,mdx}"], {
    cwd: contentDir,
    absolute: true,
  });

  // Build slug set, heading map, and alias map in a single pass over the content files
  const slugSet = new Set<string>();
  const headingMap = new Map<string, Set<string>>();
  const aliasMap = new Map<string, string>(); // slug → alias target

  type LinkEntry = { file: string; href: string; sourceSlug: string };
  const allLinks: LinkEntry[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    const rel = path.relative(contentDir, file);
    const sourceSlug = slugifyId(rel.replace(/\.[^.]+$/, ""));
    slugSet.add(sourceSlug);

    const content = await fs.readFile(file, "utf8");
    headingMap.set(sourceSlug, new Set(extractHeadings(content)));

    // Extract alias: from frontmatter — validate the target and record for anti-pattern detection
    const fm = parseFrontmatter(content);
    const aliasMatch = fm?.match(/^alias:\s*(.+)$/m);
    if (aliasMatch) {
      const aliasTarget = aliasMatch[1].trim();
      aliasMap.set(sourceSlug, aliasTarget);
      allLinks.push({ file, href: aliasTarget, sourceSlug });

      const body = fm ? content.slice(content.indexOf("---", 3) + 3) : content;
      if (body.trim().length > 0) {
        warnings.push(
          `ALIAS [non-empty] ${file}\n      has alias → ${aliasTarget} but also contains body content (body will never be rendered)`,
        );
      }
    }

    for (const href of extractLinks(content)) {
      allLinks.push({ file, href, sourceSlug });
    }
  }

  await processPool(
    allLinks,
    CONCURRENCY,
    async ({ file, href, sourceSlug }) => {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        // Skip localhost — only meaningful at runtime, not build time
        if (new URL(href).hostname === "localhost") return;
        const alive = await checkExternal(href);
        if (!alive) warnings.push(`DEAD  [external] ${href}\n      in ${file}`);
      } else if (href.startsWith("/")) {
        const exists = checkInternal(href, slugSet, headingMap);
        if (!exists) {
          errors.push(`DEAD  [internal] ${href}\n      in ${file}`);
        } else {
          const targetSlug = href.split("#")[0].replace(/^\//, "") || "index";
          const aliasTarget = aliasMap.get(targetSlug);
          if (aliasTarget) {
            warnings.push(
              `ALIAS [internal] ${href} → ${aliasTarget}\n      in ${file} (link to the destination directly)`,
            );
          }
        }
      } else if (href.startsWith("#")) {
        const exists = checkInternal(href, slugSet, headingMap, sourceSlug);
        if (!exists) errors.push(`DEAD  [fragment] ${href}\n      in ${file}`);
      }
      // mailto: — skip
    },
  );

  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):\n`);
    for (const w of warnings) console.warn(`${w}\n`);
  }

  if (errors.length) {
    console.error(`\n${errors.length} broken link(s) found:\n`);
    for (const e of errors) console.error(`${e}\n`);
    process.exit(1);
  }

  console.log(
    `✓ All links OK (${allLinks.length} checked across ${files.length} files)`,
  );
}

main();
