import { useCallback, useEffect, useState } from "react";
import type { NavNode, NavPage, NavSection } from "@/lib/nav";
import { useEventListener } from "@/lib/useEventListener";
import { NavIcon } from "./NavIcon";

interface Props {
  nav: NavNode[];
  currentHref?: string;
  onNavigate?: () => void;
}

function PageLink({
  page,
  currentHref,
  showIcon = false,
  onNavigate,
}: {
  page: NavPage;
  currentHref: string;
  showIcon?: boolean;
  onNavigate?: () => void;
}) {
  const active = currentHref === page.href;
  return (
    <a
      href={page.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="nav-link gap-2.5"
    >
      {showIcon && page.icon && (
        <NavIcon name={page.icon} className="w-4 h-4 shrink-0" />
      )}
      {page.title}
    </a>
  );
}

function hasActiveDescendant(children: NavNode[], href: string): boolean {
  return children.some((c) =>
    c.type === "page" ? c.href === href : hasActiveDescendant(c.children, href),
  );
}

function SectionGroup({
  node,
  currentHref,
  expanded,
  onToggle,
  onNavigate,
}: {
  node: NavSection;
  currentHref: string;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onNavigate?: () => void;
}) {
  const isExpanded = !!expanded[node.id];
  const childActive =
    !isExpanded && hasActiveDescendant(node.children, currentHref);
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(node.id)}
        aria-expanded={isExpanded}
        data-active={childActive || undefined}
        className="w-full nav-link justify-between"
      >
        <span className="flex items-center gap-2.5">
          {node.icon && (
            <NavIcon name={node.icon} className="w-4 h-4 shrink-0" />
          )}
          {node.title}
        </span>
        <NavIcon
          name="ChevronRight"
          aria-hidden="true"
          className="nav-chevron"
        />
      </button>
      {isExpanded && (
        <div className="ml-3 mt-0.5 pl-3 border-l border-neutral-200 dark:border-neutral-700 space-y-0.5">
          {node.children.map((child) =>
            child.type === "page" ? (
              <PageLink
                key={child.id}
                page={child}
                currentHref={currentHref}
                onNavigate={onNavigate}
              />
            ) : (
              <SectionGroup
                key={child.id}
                node={child}
                currentHref={currentHref}
                expanded={expanded}
                onToggle={onToggle}
                onNavigate={onNavigate}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function normalizePathname(p: string): string {
  return p.length > 1 ? p.replace(/\/$/, "") : p;
}

function initialExpanded(
  nav: NavNode[],
  href: string,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  function traverse(nodes: NavNode[]) {
    for (const node of nodes) {
      if (node.type === "section") {
        if (hasActiveDescendant(node.children, href)) {
          result[node.id] = true;
        }
        traverse(node.children);
      }
    }
  }
  traverse(nav);
  return result;
}

export function Sidebar({ nav, currentHref: initialHref, onNavigate }: Props) {
  // Initialize from the server-provided href to match SSR output, then sync
  // to the real URL after mount to handle any Astro swap that fired before
  // client:idle hydration.
  const [currentHref, setCurrentHref] = useState(
    normalizePathname(initialHref ?? "/"),
  );

  const syncHref = useCallback(
    () => setCurrentHref(normalizePathname(window.location.pathname)),
    [],
  );

  useEffect(() => {
    syncHref();
  }, [syncHref]);

  const doc = typeof document !== "undefined" ? document : null;
  useEventListener(doc, "astro:after-swap", syncHref);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    initialExpanded(nav, normalizePathname(initialHref ?? "/")),
  );

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <nav aria-label="Site navigation" className="space-y-1">
      {nav.map((node) =>
        node.type === "page" ? (
          <PageLink
            key={node.id}
            page={node}
            currentHref={currentHref}
            showIcon
            onNavigate={onNavigate}
          />
        ) : (
          <SectionGroup
            key={node.id}
            node={node}
            currentHref={currentHref}
            expanded={expanded}
            onToggle={toggle}
            onNavigate={onNavigate}
          />
        ),
      )}
    </nav>
  );
}
