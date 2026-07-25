import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionTitleProps {
  icon: LucideIcon;
  children: ReactNode;
}

export function SectionTitle({ icon: Icon, children }: SectionTitleProps) {
  return (
    <h2 className="flex items-center gap-1 font-heading text-base leading-snug font-medium text-foreground">
      {children} <Icon className="size-4" aria-hidden="true" />
    </h2>
  );
}
