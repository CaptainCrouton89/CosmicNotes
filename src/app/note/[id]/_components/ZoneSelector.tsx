import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zone } from "@/types/types";
import { Briefcase, Check, ChevronDown, Globe, Home } from "lucide-react";

interface ZoneSelectorProps {
  zone?: Zone;
  updating: boolean;
  onUpdateZone: (zone: Zone) => void;
}

export function ZoneSelector({
  zone,
  updating,
  onUpdateZone,
}: ZoneSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-6 gap-1.5 px-2 flex items-center justify-center ${
            zone === "personal"
              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
              : zone === "work"
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : zone === "other"
              ? "bg-gray-50 text-gray-700 hover:bg-gray-100"
              : ""
          }`}
        >
          {updating ? (
            <div className="w-3 h-3 border-t-2 border-muted-foreground rounded-full animate-spin" />
          ) : zone === "personal" ? (
            <>
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Personal</span>
            </>
          ) : zone === "work" ? (
            <>
              <Briefcase className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Work</span>
            </>
          ) : zone === "other" ? (
            <>
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Other</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 opacity-50" />
              <span className="hidden sm:inline text-xs">Zone</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        <DropdownMenuItem onClick={() => onUpdateZone("personal")}>
          <Home className="mr-2 h-4 w-4 text-blue-600" />
          <span>Personal</span>
          {zone === "personal" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdateZone("work")}>
          <Briefcase className="mr-2 h-4 w-4 text-green-600" />
          <span>Work</span>
          {zone === "work" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdateZone("other")}>
          <Globe className="mr-2 h-4 w-4 text-gray-600" />
          <span>Other</span>
          {zone === "other" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
