import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate, formatDateOnly } from "@/lib/utils";
import { Clock } from "lucide-react";

interface NoteMetadataProps {
  createdAt: string;
  updatedAt: string;
  isSaving: boolean;
}

export function NoteMetadata({
  createdAt,
  updatedAt,
  isSaving,
}: NoteMetadataProps) {
  const createdFullText = formatDate(createdAt);
  const updatedFullText = formatDate(updatedAt);
  const updatedDateOnly = formatDateOnly(updatedAt);

  // Prepare tooltip content with both timestamps
  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div>
        <strong>Created:</strong> {createdFullText}
      </div>
      <div>
        <strong>Last updated:</strong> {updatedFullText}
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <Clock className="h-4 w-4" />
            <span>Updated: {updatedDateOnly}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipContent}</TooltipContent>
      </Tooltip>

      {isSaving && (
        <div className="flex items-center gap-2">
          <span>Saving...</span>
        </div>
      )}
    </TooltipProvider>
  );
}
