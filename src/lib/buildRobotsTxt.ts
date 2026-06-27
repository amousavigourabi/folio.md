export function buildRobotsTxt(
  siteUrl: string,
  robotsDirective?: string,
): string {
  const base = siteUrl.replace(/\/$/, "");
  const directive = robotsDirective ?? "index, follow";
  const noindex = directive
    .split(",")
    .map((s) => s.trim())
    .includes("noindex");
  const disallow = noindex ? "Disallow: /" : "Disallow:";

  return `User-agent: *\n${disallow}\n\nSitemap: ${base}/sitemap.xml\n`;
}
