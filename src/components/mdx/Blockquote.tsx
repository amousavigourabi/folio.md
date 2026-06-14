import type { HTMLProps } from "./types";

type Props = HTMLProps<"blockquote">;

export function Blockquote({ children, ...props }: Props) {
  return (
    <blockquote className="mdx-blockquote" {...props}>
      {children}
    </blockquote>
  );
}
