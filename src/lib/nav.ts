import type { IconName } from "@/lib/iconNames";

export const SECTION_SENTINEL = "_section";

export type NavPage = {
  type: "page";
  title: string;
  href: string;
  id: string;
  icon?: IconName;
};

export type NavSection = {
  type: "section";
  title: string;
  id: string;
  icon?: IconName;
  children: NavPage[];
};

export type NavNode = NavPage | NavSection;

function toTitle(id: string) {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export type Crumb = { label: string; href?: string };

export function idToHref(id: string): string {
  if (id === "index") return "/";
  if (id.endsWith("/index")) return `/${id.slice(0, -6)}`;
  return `/${id}`;
}

export function buildNavTree(
  entries: {
    id: string;
    sortKey: string;
    data: { title: string; icon?: IconName; alias?: string };
  }[],
): NavNode[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.id === "index") return -1;
    if (b.id === "index") return 1;
    return a.sortKey.localeCompare(b.sortKey);
  });

  const nav: NavNode[] = [];
  const sections = new Map<string, NavSection>();

  function getOrCreateSection(sectionKey: string): NavSection {
    let section = sections.get(sectionKey);
    if (!section) {
      section = {
        type: "section",
        title: toTitle(sectionKey),
        id: sectionKey,
        children: [],
      };
      sections.set(sectionKey, section);
      nav.push(section);
    }
    return section;
  }

  for (const entry of sorted) {
    if (entry.data.alias) continue;

    const parts = entry.id.split("/");
    const last = parts[parts.length - 1];

    if (parts.length > 1 && last === SECTION_SENTINEL) {
      if (parts.length !== 2) {
        console.warn(
          `[folio] "${entry.id}": _section.mdx must be directly inside a top-level folder, ignoring.`,
        );
        continue;
      }
      const section = getOrCreateSection(parts[0]);
      section.title = entry.data.title;
      if (entry.data.icon) section.icon = entry.data.icon;
      continue;
    }

    const isTopLevel = parts.length === 1;

    if (parts.length > 3) {
      console.warn(
        `[folio] "${entry.id}" is nested more than 3 levels deep. Consider keeping content within 2 levels of folder nesting.`,
      );
    }

    if (entry.data.icon && !isTopLevel) {
      console.warn(
        `[folio] "${entry.id}" has an icon but icons are only shown for top-level pages and top-level sections (_section.mdx).`,
      );
    }

    const href = idToHref(entry.id);

    if (isTopLevel) {
      nav.push({
        type: "page",
        title: entry.data.title,
        href,
        id: entry.id,
        icon: entry.data.icon,
      });
    } else {
      getOrCreateSection(parts[0]).children.push({
        type: "page",
        title: entry.data.title,
        href,
        id: entry.id,
        icon: entry.data.icon,
      });
    }
  }

  for (const [sectionKey, section] of sections) {
    const indexIdx = section.children.findIndex(
      (c) => c.id === `${sectionKey}/index`,
    );
    if (indexIdx === -1) {
      throw new Error(
        `[folio] Section "${sectionKey}" is missing an index page. Add "index.mdx" inside the "${sectionKey}/" folder.`,
      );
    }
    if (indexIdx !== 0) {
      const [indexPage] = section.children.splice(indexIdx, 1);
      section.children.unshift(indexPage);
    }
  }

  return nav;
}

export function buildBreadcrumbMap(nav: NavNode[]): Map<string, Crumb[]> {
  const map = new Map<string, Crumb[]>();
  for (const node of nav) {
    if (node.type === "page") {
      map.set(node.href, [{ label: node.title }]);
    } else {
      const indexHref = node.children[0]?.href;
      for (const child of node.children) {
        map.set(child.href, [
          { label: node.title, href: indexHref },
          { label: child.title },
        ]);
      }
    }
  }
  return map;
}

export type Heading = { depth: number; slug: string; text: string };

export function buildPageList(nav: NavNode[]): NavPage[] {
  const pages: NavPage[] = [];
  for (const node of nav) {
    if (node.type === "page") pages.push(node);
    else pages.push(...node.children);
  }
  return pages;
}
