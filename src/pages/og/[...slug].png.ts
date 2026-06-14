import { getCollection } from "astro:content";
import { isContentPage } from "@/lib/docs";
import { generateOgImage } from "@/lib/generateOgImage";
import config from "@root/folio.config";
import type { APIRoute } from "astro";

export const prerender = true;

export async function getStaticPaths() {
  const docs = (await getCollection("docs")).filter(isContentPage);
  return docs.map((doc) => ({
    params: { slug: doc.id },
    props: { doc },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { doc } = props as Awaited<
    ReturnType<typeof getStaticPaths>
  >[number]["props"];
  const useLight = !config.dark.enabled;
  const gradient = useLight ? config.light.gradient : config.dark.gradient;
  const png = await generateOgImage({
    title: doc.data.title,
    description: doc.data.description,
    siteName: config.name,
    gradientFrom: gradient.from,
    gradientTo: gradient.to,
    darkText: useLight,
  });
  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
