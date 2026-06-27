import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import { buildRedirects } from "./src/lib/buildRedirects";
import folioConfig from "./folio.config";
import { unified } from "@astrojs/markdown-remark";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkCallout from "./src/lib/remarkCallout";
import rehypeMermaidDual from "./src/lib/rehypeMermaidDual";
import rehypeCodeHeader from "./src/lib/rehypeCodeHeader";
import rehypeHeadingClasses from "./src/lib/rehypeHeadingClasses";
import rehypeHeadingOrder from "./src/lib/rehypeHeadingOrder";
import rehypeCodeLanguage from "./src/lib/rehypeCodeLanguage";
import rehypeTaskListWrap from "./src/lib/rehypeTaskListWrap";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "./src/lib/rehypeSlug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const pkgDir = fileURLToPath(new URL(".", import.meta.url));
const contentDir = process.env.FOLIO_CONTENT_DIR ?? path.resolve(pkgDir, folioConfig.contentDir);

function findMdFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...findMdFiles(full));
    } else if (entry.endsWith(".md")) {
      found.push(full);
    }
  }
  return found;
}

function stripHtmlComments(): import("astro").AstroIntegration {
  return {
    name: "strip-html-comments",
    hooks: {
      "astro:build:done": ({ dir, pages }) => {
        const base = fileURLToPath(dir);
        for (const { pathname } of pages) {
          const candidates = [
            path.join(base, pathname, "index.html"),
            path.join(base, `${pathname.replace(/\/$/, "")}.html`),
          ];
          for (const file of candidates) {
            if (existsSync(file)) {
              const original = readFileSync(file, "utf-8");
              const stripped = original.replace(/<!--[\s\S]*?-->/g, "");
              if (stripped !== original) writeFileSync(file, stripped, "utf-8");
              break;
            }
          }
        }
      },
    },
  };
}

function noPlainMdFiles(): import("astro").AstroIntegration {
  return {
    name: "no-plain-md-files",
    hooks: {
      "astro:config:setup": () => {
        const mdFiles = findMdFiles(contentDir);
        if (mdFiles.length > 0) {
          throw new Error(
            `Plain .md files are not supported — rename these to .mdx:\n${mdFiles.map((f) => `  ${f}`).join("\n")}`
          );
        }
      },
    },
  };
}

export default defineConfig({
  redirects: buildRedirects(contentDir),
  outDir: "./dist",
  compressHTML: true,
  publicDir: process.env.FOLIO_ROOT
    ? path.join(process.env.FOLIO_ROOT, "public")
    : path.join(pkgDir, "public"),
  integrations: [
    stripHtmlComments(),
    noPlainMdFiles(),
    react(),
    mdx(),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkGfm, remarkDirective, remarkCallout],
      rehypePlugins: [
        rehypeMermaidDual,
        rehypeSlug,
        rehypeHeadingOrder,
        rehypeHeadingClasses,
        rehypeTaskListWrap,
        [rehypeAutolinkHeadings, {
          behavior: "prepend",
          properties: { className: ["mdx-heading-anchor"], ariaLabel: "Link to this section", ariaHidden: "true", dataHeadingAnchor: "true" },
          content: [],
        }],
        rehypeCodeLanguage,
        [rehypePrettyCode, { themes: { light: "github-light", dark: "github-dark" } }],
        rehypeCodeHeader,
      ],
    }),
    syntaxHighlight: false,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.join(pkgDir, "src"),
        "@root": pkgDir,
      },
    },
  },
});
