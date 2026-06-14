import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildGitDateMap } from "./gitDates";

let repoDir: string;
let contentDir: string;

function git(cmd: string, env?: Record<string, string>) {
  execSync(`git ${cmd}`, {
    cwd: repoDir,
    stdio: "pipe",
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: "1",
      HOME: repoDir,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "t@t.com",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "t@t.com",
      ...env,
    },
  });
}

function write(rel: string, content = "x") {
  writeFileSync(join(contentDir, rel), content);
}

function commit(message: string, isoDate: string) {
  const env = { GIT_AUTHOR_DATE: isoDate, GIT_COMMITTER_DATE: isoDate };
  git("add -A", env);
  git(`commit -m "${message}"`, env);
}

beforeAll(() => {
  repoDir = mkdtempSync(join(tmpdir(), "folio-git-test-"));
  contentDir = join(repoDir, "docs");
  execSync(`mkdir -p ${contentDir}`);
  git("init");
  git("config user.email t@t.com");
  git("config user.name Test");

  // Commit 1 (oldest): create page-a and page-b
  write("page-a.mdx");
  write("page-b.mdx");
  commit("create pages", "2024-01-01T00:00:00Z");

  // Commit 2: modify only page-a
  write("page-a.mdx", "updated");
  commit("update page-a", "2025-06-01T00:00:00Z");
});

afterAll(() => {
  rmSync(repoDir, { recursive: true, force: true });
});

describe("buildGitDateMap", () => {
  it("returns an empty map for a non-git directory", () => {
    const map = buildGitDateMap(tmpdir());
    expect(map.size).toBe(0);
  });

  it("returns entries for each content file", () => {
    const map = buildGitDateMap(join(repoDir, "docs"));
    expect(map.has("page-a")).toBe(true);
    expect(map.has("page-b")).toBe(true);
  });

  it("modified reflects the most recent commit", () => {
    const map = buildGitDateMap(join(repoDir, "docs"));
    expect(map.get("page-a")?.modified.toISOString()).toBe(
      "2025-06-01T00:00:00.000Z",
    );
  });

  it("created reflects the first commit", () => {
    const map = buildGitDateMap(join(repoDir, "docs"));
    expect(map.get("page-a")?.created.toISOString()).toBe(
      "2024-01-01T00:00:00.000Z",
    );
  });

  it("created === modified for files touched only once", () => {
    const map = buildGitDateMap(join(repoDir, "docs"));
    const b = map.get("page-b");
    expect(b?.created.getTime()).toBe(b?.modified.getTime());
  });
});
