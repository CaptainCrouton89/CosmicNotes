import { ChevronDown, ChevronRight } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

// ExpandableSection component for collapsible sections
interface ExpandableSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const ExpandableSection = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: ExpandableSectionProps) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="flex items-center gap-2 justify-between cursor-pointer"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </SidebarGroupLabel>
      {isOpen && <SidebarGroupContent>{children}</SidebarGroupContent>}
    </SidebarGroup>
  );
};
