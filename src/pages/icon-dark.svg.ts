import { generateIconSvg } from "@/lib/generateIconSvg";
import config from "@root/folio.config";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(
    generateIconSvg(config.dark.gradient.from, config.dark.gradient.to),
    {
      headers: { "Content-Type": "image/svg+xml" },
    },
  );
};
