import type { FolioConfig } from "@root/folio.config";
import type { Crumb } from "@/lib/nav";

export function websiteSchema(config: FolioConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.name,
    url: config.siteUrl,
    ...(config.description ? { description: config.description } : {}),
  };
}

interface ArticleOptions {
  title: string;
  description?: string;
  author?: string;
  datePublished?: Date | null;
  lastEdited?: Date | null;
  url?: string;
  ogImageUrl?: string;
  siteName: string;
  siteUrl: string;
}

export function articleSchema({
  title,
  description,
  author,
  datePublished,
  lastEdited,
  url,
  ogImageUrl,
  siteName,
  siteUrl,
}: ArticleOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    ...(description ? { description } : {}),
    ...(url ? { url } : {}),
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(datePublished ? { datePublished: datePublished.toISOString() } : {}),
    ...(lastEdited ? { dateModified: lastEdited.toISOString() } : {}),
    ...(author ? { author: { "@type": "Person", name: author } } : {}),
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  };
}

export function breadcrumbSchema(breadcrumbs: Crumb[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      ...(crumb.href
        ? { item: `${siteUrl.replace(/\/$/, "")}${crumb.href}` }
        : {}),
    })),
  };
}
