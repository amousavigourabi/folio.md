import { useEventListener } from "@/lib/useEventListener";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchEntry {
  slug: string;
  title: string;
  description: string;
}

let indexPromise: Promise<SearchEntry[]> | null = null;

function loadIndex(): Promise<SearchEntry[]> {
  if (!indexPromise) {
    indexPromise = fetch("/search-index.json")
      .then((r) => r.json())
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs kept in sync so keyboard handler stays stable (no listener churn).
  const openRef = useRef(open);
  const resultsRef = useRef(results);
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  async function ensureFuse() {
    if (fuseRef.current) return;
    const index = await loadIndex();
    if (fuseRef.current) return;
    fuseRef.current = new Fuse(index, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "description", weight: 0.3 },
      ],
      threshold: 0.4,
    });
  }

  function handleInput(value: string) {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (!fuseRef.current) return;
      const hits = fuseRef.current.search(value).map((r) => r.item);
      setResults(hits);
      setOpen(hits.length > 0);
    }, 120);
  }

  function handleNavigate(slug: string) {
    window.location.href = `/${slug}`;
    setOpen(false);
    setQuery("");
  }

  const doc = typeof document !== "undefined" ? document : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are refs (stable), intentionally empty to avoid re-registering the listener
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!openRef.current) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, resultsRef.current.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndexRef.current >= 0) {
      e.preventDefault();
      handleNavigate(resultsRef.current[activeIndexRef.current].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }, []);
  useEventListener(doc, "keydown", handleKeyDown);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      openRef.current &&
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
      setActiveIndex(-1);
    }
  }, []);
  useEventListener(doc, "mousedown", handleClickOutside);

  // Clear pending debounce on unmount.
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const resetOnSwap = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }, []);
  useEventListener(doc, "astro:after-swap", resetOnSwap);

  return (
    <div
      ref={containerRef}
      className="relative w-72 sm:w-[28rem] max-sm:w-auto max-sm:flex-1 max-sm:mx-3"
    >
      <label
        htmlFor="site-search"
        className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-700 shadow-sm px-4 h-12 cursor-text"
      >
        <span className="sr-only">Search</span>
        <Search
          aria-hidden="true"
          className="w-5 h-5 shrink-0 text-neutral-400 dark:text-neutral-500"
        />
        <input
          ref={inputRef}
          id="site-search"
          name="q"
          role="combobox"
          type="search"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => ensureFuse()}
          placeholder="Search…"
          aria-label="Search documentation"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="search-results"
          className="flex-1 min-w-0 bg-transparent text-base text-neutral-900 dark:text-neutral-100
                     placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                     outline-none"
        />
      </label>

      {open && results.length > 0 && (
        <div
          id="search-results"
          role="listbox"
          tabIndex={-1}
          aria-label="Search results"
          className="absolute top-full mt-2 w-full p-1 z-50 max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-700 shadow-lg"
        >
          {results.map((entry, i) => (
            <button
              key={entry.slug}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleNavigate(entry.slug);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={[
                "block w-full text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer",
                i === activeIndex
                  ? "search-result-active"
                  : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug">
                {entry.title}
              </p>
              {entry.description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug line-clamp-1">
                  {entry.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
