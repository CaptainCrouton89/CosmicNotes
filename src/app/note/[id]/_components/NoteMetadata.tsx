import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock } from "lucide-react";

interface NoteMetadataProps {
  createdAt: string;
  lastSaved: Date | null;
  isSaving: boolean;
  formatDate: (date: string) => string;
  formatDateOnly: (date: string) => string;
}

export function NoteMetadata({
  createdAt,
  lastSaved,
  isSaving,
  formatDate,
  formatDateOnly,
}: NoteMetadataProps) {
  const createdFullText = formatDate(createdAt);
  const createdDateOnly = formatDateOnly(createdAt);

  // Prepare tooltip content with both timestamps
  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div>
        <strong>Created:</strong> {createdFullText}
      </div>
      {lastSaved && (
        <div>
          <strong>Last updated:</strong> {formatDate(lastSaved.toISOString())}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <Clock className="h-4 w-4" />
            <span>Created: {createdDateOnly}</span>
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
