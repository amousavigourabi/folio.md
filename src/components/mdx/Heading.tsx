import type { HTMLProps } from "./types";

type Props = HTMLProps<"h1"> & { level: 1 | 2 | 3 | 4 | 5 | 6 };

export function Heading({
  level,
  children,
  id,
  className: _cls,
  ...props
}: Props) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Tag id={id} className={`group mdx-heading mdx-h${level}`} {...props}>
      {children}
    </Tag>
  );
}

type HeadingProps = HTMLProps<"h1">;

export const H1 = (p: HeadingProps) => <Heading level={1} {...p} />;
export const H2 = (p: HeadingProps) => <Heading level={2} {...p} />;
export const H3 = (p: HeadingProps) => <Heading level={3} {...p} />;
export const H4 = (p: HeadingProps) => <Heading level={4} {...p} />;
export const H5 = (p: HeadingProps) => <Heading level={5} {...p} />;
export const H6 = (p: HeadingProps) => <Heading level={6} {...p} />;
