import type { NavNode, NavPage, NavSection } from "@/lib/nav";
import { useEventListener } from "@/lib/useEventListener";
import { useCallback, useState } from "react";
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

function SectionGroup({
  node,
  currentHref,
  expanded,
  onToggle,
  onNavigate,
}: {
  node: NavSection;
  currentHref: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const childActive =
    !expanded && node.children.some((c) => c.href === currentHref);
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
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
      {expanded && (
        <div className="ml-3 mt-0.5 pl-3 border-l border-neutral-200 dark:border-neutral-700 space-y-0.5">
          {node.children.map((child) => (
            <PageLink
              key={child.id}
              page={child}
              currentHref={currentHref}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function initialExpanded(
  nav: NavNode[],
  href: string,
): Record<string, boolean> {
  return Object.fromEntries(
    nav
      .filter(
        (n) => n.type === "section" && n.children.some((c) => c.href === href),
      )
      .map((n) => [n.id, true]),
  );
}

export function Sidebar({ nav, currentHref: initialHref, onNavigate }: Props) {
  // Read window.location.pathname at hydration time so a swap that fired before
  // client:idle hydration doesn't leave us pointing at the wrong page.
  const [currentHref, setCurrentHref] = useState(() =>
    typeof window !== "undefined"
      ? window.location.pathname
      : (initialHref ?? "/"),
  );

  const syncHref = useCallback(
    () => setCurrentHref(window.location.pathname),
    [],
  );
  const doc = typeof document !== "undefined" ? document : null;
  useEventListener(doc, "astro:after-swap", syncHref);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const href =
      typeof window !== "undefined"
        ? window.location.pathname
        : (initialHref ?? "/");
    return initialExpanded(nav, href);
  });

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
            expanded={!!expanded[node.id]}
            onToggle={() => toggle(node.id)}
            onNavigate={onNavigate}
          />
        ),
      )}
    </nav>
  );
}
