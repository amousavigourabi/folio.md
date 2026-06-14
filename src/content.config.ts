import { defineCollection, z } from "astro:content";
import config from "@root/folio.config";
import { glob } from "astro/loaders";
import { iconNames } from "./lib/iconNames";
import { SECTION_SENTINEL } from "./lib/nav";
import { slugify, slugifyId } from "./lib/slugify";

const docs = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: config.contentDir,
    generateId: ({ entry }) => {
      const withoutExt = entry.replace(/\.[^.]+$/, "");
      const segments = withoutExt.split("/");
      const last = segments[segments.length - 1];

      // Preserve _section as a literal sentinel so buildNavTree can detect it
      let id: string;
      if (last === SECTION_SENTINEL) {
        const prefix = segments
          .slice(0, -1)
          .map((seg) => slugify(seg.replace(/^\d+[.\s-]+/, "").trim()))
          .join("/");
        id = prefix ? `${prefix}/${SECTION_SENTINEL}` : SECTION_SENTINEL;
      } else {
        id = slugifyId(withoutExt);
      }
      return id;
    },
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.enum(iconNames).optional(),
    noIndex: z.boolean().default(false),
    showTitle: z.boolean().default(true),
    author: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    alias: z
      .string()
      .refine((v) => !v.startsWith("http://") && !v.startsWith("https://"), {
        message: "alias must be an internal path, not an external URL",
      })
      .optional(),
  }),
});

export const collections = { docs };
