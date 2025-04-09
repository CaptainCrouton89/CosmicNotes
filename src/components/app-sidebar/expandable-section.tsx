import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

// ExpandableSection component for collapsible sections
interface ExpandableSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const ExpandableSection = ({
  title,
  icon,
  defaultExpanded = false,
  children,
}: ExpandableSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="flex items-center gap-2 justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </SidebarGroupLabel>
      {isExpanded && <SidebarGroupContent>{children}</SidebarGroupContent>}
    </SidebarGroup>
  );
};
