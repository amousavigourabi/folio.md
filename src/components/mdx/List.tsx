import type { HTMLProps } from "./types";

export function UnorderedList({
  children,
  className,
  ...props
}: HTMLProps<"ul"> & { className?: string }) {
  return (
    <ul {...props} className={`mdx-ul${className ? ` ${className}` : ""}`}>
      {children}
    </ul>
  );
}

export function OrderedList({
  children,
  className,
  ...props
}: HTMLProps<"ol"> & { className?: string }) {
  return (
    <ol {...props} className={`mdx-ol${className ? ` ${className}` : ""}`}>
      {children}
    </ol>
  );
}

export function ListItem({
  children,
  className,
  ...props
}: HTMLProps<"li"> & { className?: string }) {
  return (
    <li className={`mdx-li${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </li>
  );
}
