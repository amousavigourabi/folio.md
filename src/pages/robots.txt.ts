import { buildRobotsTxt } from "@/lib/buildRobotsTxt";
import config from "@root/folio.config";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = () => {
  const content = buildRobotsTxt(config.siteUrl, config.seo?.robots);
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
