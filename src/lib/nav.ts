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
  children: NavNode[];
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

  function getOrCreateSection(sectionId: string): NavSection {
    let section = sections.get(sectionId);
    if (!section) {
      const nameParts = sectionId.split("/");
      const name = nameParts[nameParts.length - 1];
      section = {
        type: "section",
        title: toTitle(name),
        id: sectionId,
        children: [],
      };
      sections.set(sectionId, section);
      if (nameParts.length === 1) {
        nav.push(section);
      } else {
        const parentId = nameParts.slice(0, -1).join("/");
        getOrCreateSection(parentId).children.push(section);
      }
    }
    return section;
  }

  for (const entry of sorted) {
    if (entry.data.alias) continue;

    const parts = entry.id.split("/");
    const last = parts[parts.length - 1];

    if (parts.length > 1 && last === SECTION_SENTINEL) {
      // Allow _section at depth 1 (guide/_section) and depth 2 (guide/sub/_section)
      if (parts.length > 3) {
        console.warn(
          `[folio] "${entry.id}": _section.mdx is nested too deeply, ignoring.`,
        );
        continue;
      }
      const sectionId = parts.slice(0, -1).join("/");
      const section = getOrCreateSection(sectionId);
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
      const sectionId = parts.slice(0, -1).join("/");
      getOrCreateSection(sectionId).children.push({
        type: "page",
        title: entry.data.title,
        href,
        id: entry.id,
      });
    }
  }

  // Enforce index page for top-level sections only
  for (const [sectionKey, section] of sections) {
    if (sectionKey.includes("/")) continue;
    const indexIdx = section.children.findIndex(
      (c) => c.type === "page" && c.id === `${sectionKey}/index`,
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

  function traverse(nodes: NavNode[], ancestors: Crumb[]) {
    for (const node of nodes) {
      if (node.type === "page") {
        map.set(node.href, [...ancestors, { label: node.title }]);
      } else {
        const indexPage = node.children.find(
          (c): c is NavPage => c.type === "page" && c.id === `${node.id}/index`,
        );
        const sectionCrumb: Crumb = {
          label: node.title,
          href: indexPage?.href,
        };
        traverse(node.children, [...ancestors, sectionCrumb]);
      }
    }
  }

  traverse(nav, []);
  return map;
}

export type Heading = { depth: number; slug: string; text: string };

export function buildPageList(nav: NavNode[]): NavPage[] {
  const pages: NavPage[] = [];
  function collect(nodes: NavNode[]) {
    for (const node of nodes) {
      if (node.type === "page") pages.push(node);
      else collect(node.children);
    }
  }
  collect(nav);
  return pages;
}
