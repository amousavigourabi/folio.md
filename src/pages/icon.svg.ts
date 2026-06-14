import type { APIRoute } from "astro";

export const prerender = true;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" rx="22" fill="#0D0F14"/>
  <g stroke="#6C63FF" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 22 32 L 38 50 L 22 68"/>
    <path d="M 49 50 L 79 50 A 15 15 0 1 0 75 61"/>
  </g>
</svg>`;

export const GET: APIRoute = () =>
  new Response(SVG, { headers: { "Content-Type": "image/svg+xml" } });
