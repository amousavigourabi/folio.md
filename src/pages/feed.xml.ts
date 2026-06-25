import { getDocs, isIndexablePage } from "@/lib/docs";
import { escapeXml } from "@/lib/escapeXml";
import { buildGitDateMap } from "@/lib/gitDates";
import { slugifyId } from "@/lib/slugify";
import config from "@root/folio.config";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async () => {
  const base = config.siteUrl.replace(/\/$/, "");
  const docs = await getDocs();
  const gitDates = buildGitDateMap(config.contentDir);

  const entries = docs
    .filter(isIndexablePage)
    .map((doc) => {
      const slug = slugifyId(doc.id);
      const path = slug === "index" ? "/" : `/${slug}`;
      const url = `${base}${path}`;
      const modified = gitDates.get(doc.id)?.modified;
      const published = gitDates.get(doc.id)?.created;
      return { doc, url, modified, published };
    })
    .sort((a, b) => {
      const ta = a.modified?.getTime() ?? 0;
      const tb = b.modified?.getTime() ?? 0;
      return tb - ta;
    });

  const updated =
    entries[0]?.modified?.toISOString() ?? new Date().toISOString();

  const items = entries
    .map(({ doc, url, modified, published }) => {
      const title = escapeXml(doc.data.title);
      const summary = doc.data.description
        ? `<summary>${escapeXml(doc.data.description)}</summary>`
        : "";
      const updatedEl = modified
        ? `<updated>${modified.toISOString()}</updated>`
        : "";
      const publishedEl = published
        ? `<published>${published.toISOString()}</published>`
        : "";
      return `  <entry>
    <id>${escapeXml(url)}</id>
    <title>${title}</title>
    <link href="${escapeXml(url)}" />
    ${updatedEl}
    ${publishedEl}
    ${summary}
  </entry>`;
    })
    .join("\n");

  const siteName = escapeXml(config.name);
  const siteDesc = escapeXml(config.description);
  const feedUrl = escapeXml(`${base}/feed.xml`);
  const siteUrl = escapeXml(base);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${siteUrl}/</id>
  <title>${siteName}</title>
  <subtitle>${siteDesc}</subtitle>
  <link href="${feedUrl}" rel="self" />
  <link href="${siteUrl}/" />
  <updated>${updated}</updated>
${items}
</feed>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
};
