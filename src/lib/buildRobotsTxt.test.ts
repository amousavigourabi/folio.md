import { describe, expect, it } from "vitest";
import { buildRobotsTxt } from "./buildRobotsTxt";

describe("buildRobotsTxt", () => {
  it("allows all crawlers by default", () => {
    expect(buildRobotsTxt("https://example.com")).toMatchInlineSnapshot(`
      "User-agent: *
      Disallow:

      Sitemap: https://example.com/sitemap.xml
      "
    `);
  });

  it("blocks all crawlers when noindex is set", () => {
    expect(
      buildRobotsTxt("https://example.com", "noindex, nofollow"),
    ).toContain("Disallow: /");
  });

  it("strips trailing slash from siteUrl", () => {
    expect(buildRobotsTxt("https://example.com/")).toContain(
      "Sitemap: https://example.com/sitemap.xml",
    );
  });
});
