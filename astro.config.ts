import path from "node:path";
import { fileURLToPath } from "node:url";
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

export default defineConfig({
  redirects: buildRedirects(contentDir),
  outDir: "./dist",
  publicDir: process.env.FOLIO_ROOT
    ? path.join(process.env.FOLIO_ROOT, "public")
    : path.join(pkgDir, "public"),
  integrations: [
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
