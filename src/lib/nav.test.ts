import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IconName } from "./iconNames";
import type { NavPage } from "./nav";
import { buildBreadcrumbMap, buildNavTree, buildPageList } from "./nav";

const entry = (id: string, title: string, icon?: IconName) => ({
  id,
  sortKey: id,
  data: { title, icon },
});

describe("buildNavTree", () => {
  it("produces a top-level page for a flat entry", () => {
    const [node] = buildNavTree([entry("about", "About")]);
    expect(node).toMatchObject({
      type: "page",
      title: "About",
      href: "/about",
      id: "about",
    });
  });

  it("groups nested entries under a section", () => {
    const [node] = buildNavTree([
      entry("guide/index", "Overview"),
      entry("guide/getting-started", "Getting Started"),
      entry("guide/configuration", "Configuration"),
    ]);
    expect(node).toMatchObject({ type: "section", title: "Guide" });
    expect(node.type === "section" && node.children).toHaveLength(3);
    // index is always first; then sorted alphabetically: configuration < getting-started
    expect(node.type === "section" && node.children[0]).toMatchObject({
      href: "/guide",
    });
    expect(node.type === "section" && node.children[1]).toMatchObject({
      href: "/guide/configuration",
    });
  });

  it("reads title and icon from _section entry and excludes it from children", () => {
    const [section] = buildNavTree([
      entry("guide/_section", "Guide", "BookOpen"),
      entry("guide/index", "Overview"),
      entry("guide/getting-started", "Getting Started"),
      entry("guide/configuration", "Configuration"),
    ]);
    expect(section).toMatchObject({
      type: "section",
      title: "Guide",
      icon: "BookOpen",
    });
    if (section.type === "section") {
      expect(section.children).toHaveLength(3);
      expect(section.children.every((c) => c.id !== "guide/_section")).toBe(
        true,
      );
    }
  });

  it("falls back to derived title and no icon when _section is absent", () => {
    const [section] = buildNavTree([
      entry("guide/index", "Overview"),
      entry("guide/setup", "Setup"),
    ]);
    expect(section).toMatchObject({ type: "section", title: "Guide" });
    if (section.type === "section") expect(section.icon).toBeUndefined();
  });

  it("sorts index first", () => {
    const nav = buildNavTree([entry("about", "About"), entry("index", "Home")]);
    expect(nav[0]).toMatchObject({ href: "/" });
  });

  it("Title Cases the directory name as section title", () => {
    const [node] = buildNavTree([
      entry("quick-start/index", "Overview"),
      entry("quick-start/intro", "Intro"),
    ]);
    expect(node).toMatchObject({ type: "section", title: "Quick Start" });
  });

  it("sorts entries by numeric sort key when provided, overriding alphabetical order", () => {
    const nav = buildNavTree([
      {
        id: "guide/configuration",
        sortKey: "guide/06-configuration",
        data: { title: "Configuration" },
      },
      {
        id: "guide/writing-content",
        sortKey: "guide/01-writing-content",
        data: { title: "Writing Content" },
      },
      {
        id: "guide/index",
        sortKey: "guide/index",
        data: { title: "Overview" },
      },
    ]);
    const section = nav[0];
    expect(section.type).toBe("section");
    if (section.type === "section") {
      const navPageChildren = section.children as NavPage[];
      expect(navPageChildren[0].href).toBe("/guide"); // index always first
      expect(navPageChildren[1].href).toBe("/guide/writing-content"); // 01 second
      expect(navPageChildren[2].href).toBe("/guide/configuration"); // 06 third
    }
  });
});

describe("buildNavTree warnings", () => {
  let warned: string[];

  beforeEach(() => {
    warned = [];
    vi.spyOn(console, "warn").mockImplementation((msg: string) => {
      warned.push(msg);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns when a nested page has an icon", () => {
    buildNavTree([
      entry("guide/index", "Overview"),
      entry("guide/setup", "Setup", "Wrench"),
    ]);
    expect(
      warned.some((w) => w.includes("guide/setup") && w.includes("icon")),
    ).toBe(true);
  });

  it("does not warn when a top-level _section has an icon", () => {
    buildNavTree([
      entry("guide/_section", "Guide", "BookOpen"),
      entry("guide/index", "Overview"),
      entry("guide/page", "Page"),
    ]);
    expect(warned.some((w) => w.includes("icon"))).toBe(false);
  });

  it("does not warn for _section directly inside a second-level folder", () => {
    buildNavTree([
      entry("guide/index", "Overview"),
      entry("guide/sub/_section", "Sub", "Star"),
      entry("guide/sub/page", "Page"),
    ]);
    expect(warned.some((w) => w.includes("guide/sub/_section"))).toBe(false);
  });

  it("warns and ignores _section nested more than two folders deep", () => {
    buildNavTree([
      entry("guide/index", "Overview"),
      entry("guide/sub/deep/_section", "Deep", "Star"),
      entry("guide/sub/page", "Page"),
    ]);
    expect(warned.some((w) => w.includes("guide/sub/deep/_section"))).toBe(
      true,
    );
  });

  it("warns when nesting exceeds 3 levels deep", () => {
    buildNavTree([entry("a/index", "Overview"), entry("a/b/c/page", "Page")]);
    expect(
      warned.some((w) => w.includes("a/b/c/page") && w.includes("Consider")),
    ).toBe(true);
  });

  it("does not warn for exactly 3 levels deep", () => {
    buildNavTree([entry("a/index", "Overview"), entry("a/b/page", "Page")]);
    expect(warned.some((w) => w.includes("3 levels"))).toBe(false);
  });
});

describe("buildNavTree nested sections", () => {
  it("creates a sub-section for three-part paths", () => {
    const [section] = buildNavTree([
      entry("guide/index", "Overview"),
      entry("guide/advanced/caching", "Caching"),
    ]);
    expect(section.type).toBe("section");
    if (section.type === "section") {
      const sub = section.children.find((c) => c.id === "guide/advanced");
      expect(sub).toMatchObject({ type: "section", title: "Advanced" });
      if (sub?.type === "section") {
        expect(sub.children[0]).toMatchObject({
          href: "/guide/advanced/caching",
        });
      }
    }
  });

  it("applies title and icon from sub-section _section entry", () => {
    const [section] = buildNavTree([
      entry("guide/index", "Overview"),
      entry("guide/advanced/_section", "Advanced Topics", "Star"),
      entry("guide/advanced/caching", "Caching"),
    ]);
    if (section.type === "section") {
      const sub = section.children.find((c) => c.id === "guide/advanced");
      expect(sub).toMatchObject({
        type: "section",
        title: "Advanced Topics",
        icon: "Star",
      });
    }
  });

  it("does not include sub-section _section entry as a child page", () => {
    const [section] = buildNavTree([
      entry("guide/index", "Overview"),
      entry("guide/advanced/_section", "Advanced", "Star"),
      entry("guide/advanced/caching", "Caching"),
    ]);
    if (section.type === "section") {
      const sub = section.children.find((c) => c.id === "guide/advanced");
      if (sub?.type === "section") {
        expect(
          sub.children.every((c) => c.id !== "guide/advanced/_section"),
        ).toBe(true);
      }
    }
  });

  it("does not require an index page for sub-sections", () => {
    expect(() =>
      buildNavTree([
        entry("guide/index", "Overview"),
        entry("guide/advanced/caching", "Caching"),
      ]),
    ).not.toThrow();
  });
});

describe("buildNavTree section index enforcement", () => {
  it("throws when a section has no index page", () => {
    expect(() =>
      buildNavTree([entry("guide/getting-started", "Getting Started")]),
    ).toThrow(/guide.*index/i);
  });

  it("promotes the index page to first in section children", () => {
    const [section] = buildNavTree([
      entry("guide/getting-started", "Getting Started"),
      entry("guide/index", "Overview"),
    ]);
    expect(section.type).toBe("section");
    if (section.type === "section") {
      expect(section.children[0]).toMatchObject({ id: "guide/index" });
      expect(section.children[1]).toMatchObject({
        id: "guide/getting-started",
      });
    }
  });

  it("places index first even when numeric-prefixed siblings sort earlier", () => {
    const [section] = buildNavTree([
      {
        id: "guide/writing-content",
        sortKey: "guide/01-writing-content",
        data: { title: "Writing" },
      },
      {
        id: "guide/index",
        sortKey: "guide/index",
        data: { title: "Overview" },
      },
    ]);
    if (section.type === "section") {
      expect(section.children[0].id).toBe("guide/index");
    }
  });
});

describe("buildBreadcrumbMap", () => {
  it("maps a top-level page to a single-crumb array with no href", () => {
    const map = buildBreadcrumbMap(buildNavTree([entry("about", "About")]));
    expect(map.get("/about")).toEqual([{ label: "About" }]);
  });

  it("maps a section child to [section, page] breadcrumbs with section href pointing to index", () => {
    const map = buildBreadcrumbMap(
      buildNavTree([
        entry("guide/index", "Overview"),
        entry("guide/setup", "Setup"),
      ]),
    );
    expect(map.get("/guide/setup")).toEqual([
      { label: "Guide", href: "/guide" },
      { label: "Setup" },
    ]);
  });

  it("maps the index page itself with section href pointing to index", () => {
    const map = buildBreadcrumbMap(
      buildNavTree([
        entry("guide/index", "Overview"),
        entry("guide/setup", "Setup"),
      ]),
    );
    expect(map.get("/guide")).toEqual([
      { label: "Guide", href: "/guide" },
      { label: "Overview" },
    ]);
  });

  it("maps a three-segment URL to [section, sub-section, page] breadcrumbs", () => {
    const map = buildBreadcrumbMap(
      buildNavTree([
        entry("guide/index", "Overview"),
        entry("guide/sub/deep-page", "Deep Page"),
      ]),
    );
    expect(map.get("/guide/sub/deep-page")).toEqual([
      { label: "Guide", href: "/guide" },
      { label: "Sub", href: undefined },
      { label: "Deep Page" },
    ]);
  });

  it("includes sub-section href when sub-section has an index page", () => {
    const map = buildBreadcrumbMap(
      buildNavTree([
        entry("guide/index", "Overview"),
        entry("guide/sub/index", "Sub Overview"),
        entry("guide/sub/deep-page", "Deep Page"),
      ]),
    );
    expect(map.get("/guide/sub/deep-page")).toEqual([
      { label: "Guide", href: "/guide" },
      { label: "Sub", href: "/guide/sub" },
      { label: "Deep Page" },
    ]);
  });
});

describe("buildPageList", () => {
  it("inlines section children into the flat list", () => {
    const pages = buildPageList(
      buildNavTree([
        entry("guide/index", "Overview"),
        entry("guide/getting-started", "Getting Started"),
        entry("guide/configuration", "Configuration"),
      ]),
    );
    expect(pages).toHaveLength(3);
    expect(pages[0].href).toBe("/guide"); // index always first
  });
});
