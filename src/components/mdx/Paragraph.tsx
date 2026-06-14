import type { HTMLProps } from "./types";

type Props = HTMLProps<"p">;

export function Paragraph({ children, ...props }: Props) {
  return (
    <p className="mdx-p" {...props}>
      {children}
    </p>
  );
}
