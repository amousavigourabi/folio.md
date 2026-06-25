# folio.md

A zero-config documentation site builder powered by Astro, MDX, and Tailwind CSS. Add it as a dependency to your project, point it at your docs folder, and ship. No managed platform, no per-seat pricing, no lock-in.

**Docs:** https://foliopages.dev | **Repository:** https://github.com/amousavigourabi/folio.md | **Default branch:** `master`

## Features

- Auto-generated sidebar from your file tree
- Full-text search via Fuse.js (no external service)
- Mermaid diagrams rendered to SVG at build time
- Syntax highlighting via Shiki with copy-to-clipboard
- Light and dark themes with configurable gradient backgrounds
- Open Graph images, sitemap, and Atom feed generated at build time
- Google Analytics with GDPR cookie consent banner
- Internal link validation that fails the build on broken links
- Accessible by default: semantic HTML, ARIA landmarks, keyboard navigation

## Install as a dependency

```bash
bun add github:amousavigourabi/folio.md       # bun
npm install github:amousavigourabi/folio.md   # npm
yarn add github:amousavigourabi/folio.md      # yarn
```

Then scaffold your configuration:

```bash
bunx folio init    # bun
npx folio init     # npm
yarn dlx folio init  # yarn
```

See the [Getting Started guide](src/content/docs/guide/05.Getting%20Started.mdx) for full setup instructions.

## Develop folio.md itself

To contribute to folio.md, install [Bun](https://bun.sh) ≥ 1.1 and clone the repository:

```bash
git clone https://github.com/amousavigourabi/folio.md.git
cd folio-md
bun install
bun run dev
```

Open [http://localhost:4321](http://localhost:4321) to view the site.

## Commands

| Command                  | Action                                        |
|--------------------------|-----------------------------------------------|
| `bun run dev`            | Start local dev server at `localhost:4321`    |
| `bun run build`          | Validate links then build to `dist/`          |
| `bun run preview`        | Preview the production build locally          |
| `bun run validate-links` | Check all internal and external links         |
| `bun run lint`           | Lint with Biome                               |
| `bun run test`           | Run tests with Vitest                         |

## Content

Docs live in `src/content/docs/` as `.mdx` files. Each file's frontmatter controls its title, nav icon, and sidebar order:

```mdx
---
title: My Page
icon: House
order: 1
---
```

Available icons are defined in `src/components/NavIcon.tsx`.

## Project Structure

```
src/
├── content/docs/     # MDX documentation pages
├── components/       # React + Astro components
├── layouts/          # DocLayout.astro (main shell)
├── lib/              # nav builder, slugify, rehype plugins
├── pages/            # [...slug].astro (dynamic routing)
└── styles/           # global.css (Tailwind + theme vars)
scripts/
└── validate-links.ts # Run at build time to catch broken links
```

## Contributing

Bug reports, feature requests, and pull requests are welcome. Open issues at https://github.com/amousavigourabi/folio.md/issues and submit PRs against `master`. See [Contributing](https://foliopages.dev/project/contributing) for the full development guide.

## License

MIT. See [LICENSE](LICENSE).
