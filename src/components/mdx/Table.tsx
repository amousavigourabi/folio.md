import type { HTMLProps } from "./types";

export function Table({ children, ...props }: HTMLProps<"table">) {
  return (
    <div className="mdx-table-wrap">
      <table className="mdx-table" {...props}>
        {children}
      </table>
    </div>
  );
}

export const TableHead = (props: HTMLProps<"thead">) => (
  <thead className="mdx-thead" {...props} />
);
export const TableBody = (props: HTMLProps<"tbody">) => (
  <tbody className="mdx-tbody" {...props} />
);
export const TableRow = (props: HTMLProps<"tr">) => (
  <tr className="mdx-tr" {...props} />
);
export const TableHeader = (props: HTMLProps<"th">) => (
  <th className="mdx-th" {...props} />
);
export const TableCell = (props: HTMLProps<"td">) => (
  <td className="mdx-td" {...props} />
);
