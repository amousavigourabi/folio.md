import { z } from "astro/zod";
import { iconNames } from "./src/lib/iconNames";

const LIGHT_GRADIENT_DEFAULT = { from: "#c7d2fe", to: "#ddd6fe" } as const;
const DARK_GRADIENT_DEFAULT = { from: "#020617", to: "#1e1b4b" } as const;

const GradientSchema = (defaults: { from: string; to: string }) =>
  z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional()
    .transform((g) => ({
      from: g?.from ?? defaults.from,
      to: g?.to ?? defaults.to,
    }));

const FolioConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  contentDir: z.string().default("./docs"),
  lang: z.string().default("en"),
  siteUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "siteUrl must start with http:// or https://",
    }),
  light: z
    .object({
      enabled: z.boolean().optional(),
      gradient: GradientSchema(LIGHT_GRADIENT_DEFAULT),
      icons: z
        .object({
          favicon: z.string().optional(),
          appleTouchIcon: z.string().optional(),
        })
        .optional(),
    })
    .optional()
    .transform((l) => ({
      enabled: l?.enabled ?? true,
      gradient: l?.gradient ?? LIGHT_GRADIENT_DEFAULT,
      icons: l?.icons,
    })),
  dark: z
    .object({
      enabled: z.boolean().optional(),
      gradient: GradientSchema(DARK_GRADIENT_DEFAULT),
      icons: z
        .object({
          favicon: z.string().optional(),
        })
        .optional(),
    })
    .optional()
    .transform((d) => ({
      enabled: d?.enabled ?? false,
      gradient: d?.gradient ?? DARK_GRADIENT_DEFAULT,
      icons: d?.icons,
    })),
  seo: z
    .object({
      locale: z
        .string()
        .transform((v) => v.replace(/_/g, "-"))
        .optional(),
      robots: z.string().optional(),
      twitterHandle: z.string().optional(),
    })
    .optional(),
  gaId: z.string().optional(),
  accentHue: z.number().min(0).max(360).optional(),
  editLink: z.object({ base: z.string() }).optional(),
  pagination: z.boolean().default(true),
  footer: z
    .object({
      text: z.string().optional(),
      links: z
        .array(z.object({ label: z.string(), href: z.string() }))
        .optional(),
    })
    .optional(),
  navbar: z
    .object({
      links: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
            icon: z.enum(iconNames).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  vale: z
    .object({
      configFile: z.string().optional(),
      minErrorLevel: z
        .enum(["suggestion", "warning", "error"])
        .default("error"),
      accept: z.array(z.string()).optional(),
    })
    .default({ minErrorLevel: "error" }),
});

export type FolioConfig = z.infer<typeof FolioConfigSchema>;

export function defineFolioConfig(
  config: z.input<typeof FolioConfigSchema>,
): FolioConfig {
  const result = FolioConfigSchema.safeParse(config);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid folio.config.ts:\n${messages}`);
  }
  if (result.data.siteUrl?.startsWith("http://")) {
    console.warn(
      "folio.md warning: siteUrl uses http:// — switch to https:// to ensure secure links in OG tags, sitemaps, and structured data.",
    );
  }
  return result.data;
}

const raw = {
  name: "folio.md",
  description: "A documentation site built with Astro and MDX.",
  contentDir: "./src/content/docs",
  siteUrl: "https://foliopages.dev",
  dark: { enabled: true },
  editLink: {
    base: "https://github.com/amousavigourabi/folio.md/edit/master/src/content/docs",
  },
  gaId: "G-B42W3W5WP3",
  vale: {
    accept: [
      "[Aa]llowlists?",
      "[Aa]ntipatterns?",
      "APIs?",
      "ARIA",
      "Astro",
      "Atour Mousavi Gourabi",
      "[Aa]utolinks?",
      "[Bb]lockquotes?",
      "[Cc]allouts?",
      "[Bb]ooleans?",
      "CDN",
      "CMP",
      "[Dd]ev",
      "[Ll]efthook",
      "GDPR",
      "GitHub",
      "GitLab",
      "ISC",
      "Lucide",
      "MDX",
      "MIT",
      "MPL",
      "[Nn]avbar",
      "Panzoom",
      "nginx",
      "npm",
      "Globby",
      "Open Graph",
      "[Pp]repend(ed|s|ing)?",
      "px",
      "[Ss]caffold(ed|s|ing)?",
      "SEO",
      "Shiki",
      "[Ss]ubpaths?",
      "[Ss]uperset",
      "[Ss]trikethroughs?",
      "tsx",
      "[Vv]alidators?",
      "Vitest",
      "VPS",
    ],
  },
} satisfies z.input<typeof FolioConfigSchema>;

export default defineFolioConfig(raw);
