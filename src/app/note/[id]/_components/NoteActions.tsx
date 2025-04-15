"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MoreVertical, Save, Trash2 } from "lucide-react";
import { useState } from "react";

interface NoteActionsProps {
  onRefresh: () => void;
  onSave: () => void;
  onDelete: () => void;
  onExportRawText: () => void;
  onExportToPDF: () => void;
  hasChanges: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  disabled: boolean;
}

export function NoteActions({
  onRefresh,
  onSave,
  onDelete,
  onExportRawText,
  onExportToPDF,
  hasChanges,
  isRefreshing,
  isSaving,
  disabled,
}: NoteActionsProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div className="flex items-center xl:gap-4 xl:self-auto self-start absolute top-3 right-3">
      <Button
        variant="ghost"
        onClick={onSave}
        disabled={isSaving || !hasChanges || disabled}
      >
        <Save className="h-4 w-4" />
        {isSaving && "Saving..."}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onRefresh}
            disabled={isRefreshing || disabled}
            className="cursor-pointer"
          >
            {isRefreshing ? "Regenerating..." : "Regenerate AI Classifications"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onExportRawText}
            disabled={isRefreshing || disabled}
            className="cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Export Raw Text
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onExportToPDF}
            disabled={isRefreshing || disabled}
            className="cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Export to PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant={deleteConfirmOpen ? "destructive" : "ghost"}
        size="sm"
        className="transition-all duration-400 ease-in-out"
        disabled={disabled}
        onClick={() => {
          if (!deleteConfirmOpen) setDeleteConfirmOpen(true);
          else onDelete();
        }}
        onMouseLeave={() => {
          if (deleteConfirmOpen) setDeleteConfirmOpen(false);
        }}
      >
        {deleteConfirmOpen ? (
          "Confirm Delete"
        ) : (
          <div className="hover:text-destructive">
            <Trash2 className="h-4 w-4 " />
          </div>
        )}
      </Button>
    </div>
  );
}
