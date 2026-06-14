import type React from "react";

export type HTMLProps<T extends keyof React.JSX.IntrinsicElements> = Omit<
  React.JSX.IntrinsicElements[T],
  "className"
>;
