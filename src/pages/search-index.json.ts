import { getDocs, isContentPage } from "@/lib/docs";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async () => {
  const docs = (await getDocs()).filter(isContentPage);
  const index = docs.map((doc) => ({
    slug: doc.id === "index" ? "" : doc.id,
    title: doc.data.title,
    description: doc.data.description ?? "",
  }));
  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json" },
  });
};
