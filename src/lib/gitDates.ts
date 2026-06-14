import { execSync } from "node:child_process";
import { realpathSync } from "node:fs";
import path from "node:path";
import { slugifyId } from "./slugify";

const COMMIT_PREFIX = "---COMMIT--- ";

export interface GitDates {
  modified: Date;
  created: Date;
}

// contentDir: path to the content directory, resolved relative to the git repo root (e.g. "./src/content/docs")
// git log is newest-first, so first-seen = modified, last-seen = created.
export function buildGitDateMap(contentDir: string): Map<string, GitDates> {
  const modified = new Map<string, Date>();
  const created = new Map<string, Date>();
  try {
    const root = realpathSync(
      execSync("git rev-parse --show-toplevel", {
        encoding: "utf-8",
        cwd: path.isAbsolute(contentDir) ? contentDir : undefined,
      }).trim(),
    );
    const absContentDir = realpathSync(path.resolve(root, contentDir));
    const log = execSync(`git log --format="${COMMIT_PREFIX}%ci" --name-only`, {
      encoding: "utf-8",
      cwd: root,
    });
    let current: Date | null = null;
    for (const line of log.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith(COMMIT_PREFIX)) {
        current = new Date(t.slice(COMMIT_PREFIX.length));
        continue;
      }
      if (current === null) continue;
      const abs = path.join(root, t);
      const rel = path.relative(absContentDir, abs);
      if (rel.startsWith("..")) continue; // outside the content dir
      const id = slugifyId(rel.replace(/\.[^.]+$/, ""));
      if (!modified.has(id)) modified.set(id, current); // newest = first seen
      created.set(id, current); // oldest = last overwrite
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/not a git repository|does not have any commits/i.test(msg)) {
      console.warn("[gitDates] could not read git log:", msg);
    }
  }
  const result = new Map<string, GitDates>();
  for (const [id, mod] of modified) {
    result.set(id, { modified: mod, created: created.get(id) ?? mod });
  }
  return result;
}
