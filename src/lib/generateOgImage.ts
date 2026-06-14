import satori from "satori";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  try {
    const [regular, bold] = await Promise.all([
      fetch(
        "https://fonts.bunny.net/inter/files/inter-latin-400-normal.woff",
      ).then((r) => r.arrayBuffer()),
      fetch(
        "https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff",
      ).then((r) => r.arrayBuffer()),
    ]);
    fontCache = { regular, bold };
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(
      `folio: failed to load OG image fonts from Bunny CDN — ${cause}`,
    );
  }
  return fontCache;
}

interface OgOptions {
  title: string;
  description?: string;
  siteName: string;
  gradientFrom: string;
  gradientTo: string;
  darkText?: boolean;
}

export async function generateOgImage(opts: OgOptions): Promise<Buffer> {
  const {
    title,
    description,
    siteName,
    gradientFrom,
    gradientTo,
    darkText = false,
  } = opts;
  const textPrimary = darkText ? "rgba(0,0,0,0.9)" : "white";
  const textMuted = darkText ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)";
  const textBody = darkText ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.75)";
  const fonts = await loadFonts();

  const vnode = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "60px",
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              color: textMuted,
              fontSize: 22,
              marginBottom: 28,
            },
            children: [siteName],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              color: textPrimary,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 1000,
            },
            children: [title],
          },
        },
        ...(description
          ? [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: textBody,
                    fontSize: 24,
                    marginTop: 24,
                    maxWidth: 900,
                    lineHeight: 1.5,
                  },
                  children: [description],
                },
              },
            ]
          : []),
      ],
    },
  };

  const svg = await satori(vnode, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Inter", data: fonts.regular, weight: 400, style: "normal" },
      { name: "Inter", data: fonts.bold, weight: 700, style: "normal" },
    ],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}
