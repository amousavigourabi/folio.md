import type { HTMLProps } from "./types";

type Props = HTMLProps<"a">;

export function Anchor({ href, children, ...props }: Props) {
  if ((props as { "data-heading-anchor"?: boolean })["data-heading-anchor"]) {
    return (
      <a href={href} className="mdx-heading-anchor" {...props}>
        {children}
      </a>
    );
  }
  const isExternal =
    (href?.startsWith("http://") || href?.startsWith("https://")) ?? false;
  return (
    <a
      href={href}
      className="mdx-a"
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      {isExternal && <span className="sr-only"> (opens in new tab)</span>}
    </a>
  );
}
