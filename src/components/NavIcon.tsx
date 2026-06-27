import type { LucideProps } from "lucide-react";
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
import type { ComponentType } from "react";
import type { IconName } from "@/lib/iconNames";

export { iconNames } from "@/lib/iconNames";
export type { IconName };

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
