import type { IconName } from "@/lib/iconNames";
import {
  Book,
  BookOpen,
  ChevronRight,
  Code,
  FileText,
  GitBranch,
  Globe,
  House,
  LifeBuoy,
  Package,
  Rocket,
  Settings,
  Shield,
  Star,
  Terminal,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

export type { IconName };
export { iconNames } from "@/lib/iconNames";

const icons: Record<IconName, ComponentType<LucideProps>> = {
  Book,
  BookOpen,
  ChevronRight,
  Code,
  FileText,
  GitBranch,
  Globe,
  House,
  LifeBuoy,
  Package,
  Rocket,
  Settings,
  Shield,
  Star,
  Terminal,
  Users,
  Wrench,
  Zap,
};

export function NavIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const Icon = icons[name];
  return <Icon {...props} />;
}
