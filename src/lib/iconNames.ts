export const iconNames = [
  "Book",
  "BookOpen",
  "ChevronRight",
  "Code",
  "FileText",
  "GitBranch",
  "Globe",
  "House",
  "LifeBuoy",
  "Package",
  "Rocket",
  "Settings",
  "Shield",
  "Star",
  "Terminal",
  "Users",
  "Wrench",
  "Zap",
] as const satisfies readonly string[];

export type IconName = (typeof iconNames)[number];
