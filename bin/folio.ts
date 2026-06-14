#!/usr/bin/env bun
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { FolioConfig } from "../folio.config";
import { lintVale } from "../scripts/lintVale";

const [, , command = "help", ...rest] = process.argv;
const cwd = process.cwd();
const pkgDir = fileURLToPath(new URL("..", import.meta.url));

if (command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "init") {
  runInit();
  process.exit(0);
}

const configPath = resolve(cwd, "folio.config.ts");
if (!existsSync(configPath)) {
  console.error(`folio: no folio.config.ts found in ${cwd}`);
  console.error(`       run \`folio init\` to scaffold one`);
  process.exit(1);
}

let config: FolioConfig;
try {
  ({ default: config } = await import(pathToFileURL(configPath).href));
} catch (err) {
  const cause = err instanceof Error ? err.message : String(err);
  console.error(`folio: failed to load folio.config.ts — ${cause}`);
  process.exit(1);
}
const contentDir = resolve(cwd, config.contentDir);

if (command === "lint") {
  lintVale(config.vale, contentDir);
  // lintVale always calls process.exit() — unreachable
}

if (command === "build") {
  const validateResult = spawnSync(
    "bun",
    [resolve(pkgDir, "scripts/validate-links.ts")],
    {
      stdio: "inherit",
      env: { ...process.env, FOLIO_ROOT: cwd, FOLIO_CONTENT_DIR: contentDir },
    },
  );
  if (validateResult.status !== 0) process.exit(validateResult.status ?? 1);
}

// "start" is an alias for "preview" (mirrors npm start convention)
const astroCmd = command === "start" ? "preview" : command;

const result = spawnSync("bun", ["x", "astro", astroCmd, "--root", pkgDir, ...rest], {
  stdio: "inherit",
  env: {
    ...process.env,
    FOLIO_ROOT: cwd,
    FOLIO_CONTENT_DIR: contentDir,
  },
});

process.exit(result.status ?? 0);

function printHelp() {
  console.log(`
Usage: folio <command> [options]

Commands:
  dev      Start the development server
  build    Build the site for production
  preview  Preview the production build locally
  start    Alias for preview
  check    Run TypeScript type checking
  lint     Lint content prose with Vale
  init     Scaffold folio.config.ts and a docs folder
  help     Show this message

Any unrecognised command is forwarded to Astro directly.
`.trim());
}

function runInit() {
  const configDest = resolve(cwd, "folio.config.ts");
  if (existsSync(configDest)) {
    console.log("folio: folio.config.ts already exists, skipping");
  } else {
    writeFileSync(
      configDest,
      `import { defineFolioConfig } from "folio-md/types";

export default defineFolioConfig({
  name: "My Docs",
  description: "Documentation for my project.",
  contentDir: "./docs",
  siteUrl: "https://docs.example.com",
});
`,
    );
    console.log("folio: created folio.config.ts");
  }

  const docsDest = resolve(cwd, "docs", "index.md");
  if (!existsSync(docsDest)) {
    mkdirSync(resolve(cwd, "docs"), { recursive: true });
    writeFileSync(
      docsDest,
      `---
title: Welcome
description: My documentation homepage
---

# Welcome

Start writing your docs here.
`,
    );
    console.log("folio: created docs/index.md");
  }

  const pkgJsonPath = resolve(cwd, "package.json");
  if (existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    pkg.scripts ??= {};
    let changed = false;
    const scripts: [string, string][] = [
      ["folio:dev",     "folio dev"],
      ["folio:build",   "folio build"],
      ["folio:preview", "folio preview"],
      ["folio:check",   "folio check"],
      ["folio:lint",    "folio lint"],
    ];
    for (const [key, val] of scripts) {
      if (!pkg.scripts[key]) {
        pkg.scripts[key] = val;
        changed = true;
      }
    }
    if (changed) {
      writeFileSync(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
      console.log("folio: added folio:dev / folio:build / folio:preview / folio:check / folio:lint to package.json");
    }
  }
}
