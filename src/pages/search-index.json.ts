import type { APIRoute } from "astro";
import { getDocs, isContentPage } from "@/lib/docs";
import { idToHref } from "@/lib/nav";

export const prerender = true;

export const GET: APIRoute = async () => {
  const docs = (await getDocs()).filter(isContentPage);
  const index = docs.map((doc) => ({
    slug: idToHref(doc.id).replace(/^\//, ""),
    title: doc.data.title,
    description: doc.data.description ?? "",
  }));
  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json" },
  });
};
