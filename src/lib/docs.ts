import { SECTION_SENTINEL } from "./nav";

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
