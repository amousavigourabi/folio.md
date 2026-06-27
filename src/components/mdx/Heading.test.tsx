import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { H1, H2, H3, H4, H5, H6 } from "./Heading";

const render = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("heading exports", () => {
  it("H1 renders <h1> with mdx-h1 styles", () => {
    const html = render(<H1>text</H1>);
    expect(html).toMatch(/^<h1[ >]/);
    expect(html).toContain("mdx-h1");
  });

  it("H2 renders <h2> with mdx-h1 styles", () => {
    const html = render(<H2>text</H2>);
    expect(html).toMatch(/^<h2[ >]/);
    expect(html).toContain("mdx-h1");
  });

  it("H3 renders <h3> with mdx-h2 styles", () => {
    const html = render(<H3>text</H3>);
    expect(html).toMatch(/^<h3[ >]/);
    expect(html).toContain("mdx-h2");
  });

  it("H4 renders <h4> with mdx-h3 styles", () => {
    const html = render(<H4>text</H4>);
    expect(html).toMatch(/^<h4[ >]/);
    expect(html).toContain("mdx-h3");
  });

  it("H5 renders <h5> with mdx-h4 styles", () => {
    const html = render(<H5>text</H5>);
    expect(html).toMatch(/^<h5[ >]/);
    expect(html).toContain("mdx-h4");
  });

  it("H6 renders <h6> with mdx-h5 styles", () => {
    const html = render(<H6>text</H6>);
    expect(html).toMatch(/^<h6[ >]/);
    expect(html).toContain("mdx-h5");
  });

  it("forwards id and children", () => {
    const html = render(<H2 id="my-section">Hello</H2>);
    expect(html).toContain('id="my-section"');
    expect(html).toContain("Hello");
  });
});
