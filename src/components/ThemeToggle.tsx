import { useEventListener } from "@/lib/useEventListener";
import { Moon, Sun } from "lucide-react";
import { useCallback, useState } from "react";

export function ThemeToggle() {
  // Initial state: read the class already set by the inline theme-init script in DocLayout.
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

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
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      type="button"
      className="cursor-pointer icon-btn"
    >
      {dark ? (
        <Sun aria-hidden="true" className="w-5 h-5" />
      ) : (
        <Moon aria-hidden="true" className="w-5 h-5" />
      )}
    </button>
  );
}
