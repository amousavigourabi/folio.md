import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NavNode } from "@/lib/nav";
import { useEventListener } from "@/lib/useEventListener";
import { useScrollLock } from "@/lib/useScrollLock";
import { Sidebar } from "./Sidebar";

interface Props {
  nav: NavNode[];
  name: string;
  lightIcon?: string;
  darkIcon?: string;
  lightMode: boolean;
  darkMode: boolean;
}

export function MobileMenuButton({
  nav,
  name,
  lightIcon,
  darkIcon,
  lightMode,
  darkMode,
}: Props) {
  const [isOpen, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  // Needs to be stable so useEventListener doesn't re-register on every render.
  // setOpen is guaranteed stable by React, so the dep array is safely empty.
  const closeOnEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);
  const doc = typeof document !== "undefined" ? document : null;
  useEventListener<KeyboardEvent>(doc, "keydown", closeOnEscape);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={isOpen}
        onClick={() => setOpen(true)}
        className="lg:hidden -ml-1 icon-btn"
      >
        <Menu aria-hidden="true" className="w-5 h-5" />
      </button>

      {/* Backdrop: keyboard users rely on the Escape handler to close the drawer */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: decorative backdrop; Escape key closes the drawer */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel: <dialog> without showModal() drops the CSS slide transition; div[role=dialog] is intentional */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        inert={!isOpen}
        className={`fixed inset-y-0 left-0 z-40 w-72 hidden max-lg:flex flex-col
                    bg-white dark:bg-slate-900
                    border-r border-neutral-200 dark:border-white/5
                    shadow-2xl transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-neutral-100 dark:border-white/5 shrink-0">
          <a
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-neutral-100
                       hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {lightMode && lightIcon && (
              <img
                src={lightIcon}
                alt=""
                aria-hidden="true"
                className={`h-5 w-5 shrink-0${darkMode ? " dark:hidden" : ""}`}
              />
            )}
            {darkMode && darkIcon && (
              <img
                src={darkIcon}
                alt=""
                aria-hidden="true"
                className={`h-5 w-5 shrink-0${lightMode ? " hidden dark:block" : ""}`}
              />
            )}
            {name}
          </a>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="icon-btn"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <Sidebar nav={nav} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
