import { getDocs, isIndexablePage } from "@/lib/docs";
import { buildGitDateMap } from "@/lib/gitDates";
import { slugifyId } from "@/lib/slugify";
import config from "@root/folio.config";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async () => {
  const base = config.siteUrl.replace(/\/$/, "");
  const docs = await getDocs();
  const gitDates = buildGitDateMap(config.contentDir);

  const urls = docs.filter(isIndexablePage).map((doc) => {
    const slug = slugifyId(doc.id);
    const path = slug === "index" ? "/" : `/${slug}`;
    const modified = gitDates.get(doc.id)?.modified;
    const lastmod = modified
      ? `\n    <lastmod>${modified.toISOString().slice(0, 10)}</lastmod>`
      : "";
    return `  <url>\n    <loc>${base}${path}</loc>${lastmod}\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
