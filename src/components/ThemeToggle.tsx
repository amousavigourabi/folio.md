import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useEventListener } from "@/lib/useEventListener";

export function ThemeToggle() {
  // Start false to match server render; sync to real DOM state after mount.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Re-sync after Astro page swaps in case the component is not transition:persist'd.
  const sync = useCallback(
    () => setDark(document.documentElement.classList.contains("dark")),
    [],
  );
  const doc = typeof document !== "undefined" ? document : null;
  useEventListener(doc, "astro:after-swap", sync);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      suppressHydrationWarning
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      type="button"
      className="cursor-pointer icon-btn"
    >
      {/* CSS drives visibility so the inline theme script's class takes effect before React hydrates - no flash */}
      <Moon aria-hidden="true" className="w-5 h-5 dark:hidden" />
      <Sun aria-hidden="true" className="w-5 h-5 hidden dark:block" />
    </button>
  );
}
