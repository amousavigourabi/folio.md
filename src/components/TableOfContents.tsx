import type { Heading } from "@/lib/nav";
import { useEffect, useState } from "react";

interface Props {
  headings: Heading[];
}

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const slugs = new Set(headings.map((h) => h.slug));
    const headingEls = Array.from(
      document.querySelectorAll<HTMLElement>(".mdx-heading[id]"),
    ).filter((el) => slugs.has(el.id));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      // Shrink the bottom 80% of the viewport so only headings near the top of the screen activate.
      { rootMargin: "0px 0px -80% 0px", threshold: 0 },
    );

    for (const el of headingEls) observer.observe(el);
    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        On this page
      </p>
      <ul className="space-y-1">
        {headings.map((h) => {
          const isActive = activeId === h.slug;
          return (
            <li key={h.slug} className={h.depth === 2 ? "pl-3" : undefined}>
              <a
                href={`#${h.slug}`}
                aria-current={isActive || undefined}
                className="toc-link"
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
