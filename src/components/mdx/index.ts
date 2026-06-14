import { Anchor } from "./Anchor";
import { Blockquote } from "./Blockquote";
import { Divider } from "./Divider";
import { H1, H2, H3, H4, H5, H6 } from "./Heading";
import { ListItem, OrderedList, UnorderedList } from "./List";
import { Paragraph } from "./Paragraph";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

export const mdxComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: Paragraph,
  a: Anchor,
  blockquote: Blockquote,
  hr: Divider,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  th: TableHeader,
  td: TableCell,
};
