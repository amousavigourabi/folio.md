import path from "node:path";
import { getCollection } from "astro:content";
import config from "@root/folio.config";
import { SECTION_SENTINEL } from "./nav";
import { slugifyIdOrdered } from "./slugify";

interface Doc {
  id: string;
  data: { alias?: string; noIndex?: boolean };
}

/** Excludes _section sentinel files and redirect aliases. */
export function isContentPage(doc: Doc): boolean {
  return (
    doc.id !== SECTION_SENTINEL &&
    !doc.id.endsWith(`/${SECTION_SENTINEL}`) &&
    !doc.data.alias
  );
}

/** isContentPage plus excludes noIndex pages (used for sitemap). */
export function isIndexablePage(doc: Doc): boolean {
  return isContentPage(doc) && !doc.data.noIndex;
}

function withSortKeys<T extends { id: string; filePath?: string }>(
  docs: T[],
  contentDirAbs: string,
): (T & { sortKey: string })[] {
  return docs.map((doc) => ({
    ...doc,
    sortKey: doc.filePath
      ? slugifyIdOrdered(
          path.relative(contentDirAbs, doc.filePath).replace(/\.[^.]+$/, ""),
        )
      : doc.id,
  }));
}

export async function getDocs() {
  const docs = await getCollection("docs");
  return withSortKeys(docs, path.resolve(config.contentDir));
}
