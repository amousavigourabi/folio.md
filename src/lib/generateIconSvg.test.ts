import { describe, expect, it } from "vitest";
import { generateIconSvg } from "./generateIconSvg";

describe("generateIconSvg", () => {
  it("injects both colors into the gradient stops in order", () => {
    const svg = generateIconSvg("#aabbcc", "#112233");
    expect(svg).toContain('stop-color="#aabbcc"');
    expect(svg).toContain('stop-color="#112233"');
    expect(svg.indexOf("#aabbcc")).toBeLessThan(svg.indexOf("#112233"));
  });

  it("produces a valid SVG with the expected structural elements", () => {
    const svg = generateIconSvg("#000000", "#ffffff");
    expect(svg).toContain("<svg");
    expect(svg).toContain("linearGradient");
    expect(svg).toContain('id="ball"');
    expect(svg).toContain('fill="url(#ball)"');
  });

  it("escapes special characters in color values", () => {
    const svg = generateIconSvg('"></stop><evil>', "#fff");
    expect(svg).not.toContain('"></stop><evil>');
    expect(svg).toContain("&quot;");
    expect(svg).toContain("&lt;");
  });
});
