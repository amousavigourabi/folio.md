# folio.md

An Astro-powered documentation site with MDX content, Tailwind CSS, and dual-theme Mermaid diagram support.

## Getting Started

```bash
bun install
bun run dev
```

Open [http://localhost:4321](http://localhost:4321) to view the site.

## Commands

| Command              | Action                                        |
|----------------------|-----------------------------------------------|
| `bun run dev`        | Start local dev server at `localhost:4321`    |
| `bun run build`      | Validate links then build to `dist/`          |
| `bun run preview`    | Preview the production build locally          |
| `bun run validate-links` | Check all internal and external links    |

## Content

Docs live in `src/content/docs/` as `.mdx` files. Each file's frontmatter controls its title, nav icon, and sidebar order:

```mdx
---
title: My Page
icon: house
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
