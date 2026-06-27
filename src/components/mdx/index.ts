import { Anchor } from "./Anchor";
import { Blockquote } from "./Blockquote";
import { Divider } from "./Divider";
import { H2, H3, H4, H5, H6, H6Error } from "./Heading";
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
  h1: H2,
  h2: H3,
  h3: H4,
  h4: H5,
  h5: H6,
  h6: H6Error,
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
