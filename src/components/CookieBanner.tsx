import { useEffect, useState } from "react";

type Consent = "granted" | "denied" | null;

const STORAGE_KEY = "cookie-consent";

function loadGA(gaId: string) {
  if (typeof window === "undefined") return;
  // Avoid double-loading
  if (window.__gaLoaded) return;
  window.__gaLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  const gtag: (...args: unknown[]) => void = (...args) =>
    window.dataLayer?.push(args);
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", gaId, { anonymize_ip: true });

  // Re-fire page_view on each Astro view-transition navigation
  document.addEventListener("astro:page-load", () => {
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_title: document.title,
    });
  });
}

export function CookieBanner({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState<Consent>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  });

  // Load GA immediately if previously granted (e.g. after a page refresh)
  useEffect(() => {
    if (consent === "granted") loadGA(gaId);
  }, [consent, gaId]);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "granted");
    setConsent("granted");
    loadGA(gaId);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "denied");
    setConsent("denied");
  }

  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-live="polite"
      className="panel fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(calc(100vw-2rem),560px)]
                 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-0.5">
          We use cookies
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          This site uses Google Analytics to understand how visitors use it. No
          personal data is sold or shared. You can decline and no cookies will
          be set.
        </p>
      </div>
      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={decline}
          className="flex-1 sm:flex-none cursor-pointer rounded-lg border border-neutral-200
                     dark:border-white/10 px-4 py-2 text-xs font-medium
                     text-neutral-600 dark:text-neutral-300
                     hover:bg-black/5 dark:hover:bg-white/10
                     transition-colors focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-neutral-400"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={accept}
          className="cookie-accept-btn flex-1 sm:flex-none cursor-pointer rounded-lg
                     px-4 py-2 text-xs font-medium transition-colors
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-neutral-400"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
