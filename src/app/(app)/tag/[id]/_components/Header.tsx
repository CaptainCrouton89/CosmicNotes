import { LeftHeader } from "@/components/header/LeftHeader";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { Cluster } from "@/types/types";
import { format } from "date-fns";
import { Calendar, Check, Clock, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ITagHeaderProps {
  tagName: string;
  tagId: number;
  noteCount: number;
  activeCluster: Omit<Cluster, "tag"> | null;
}

export function Header({
  tagName,
  tagId,
  noteCount,
  activeCluster,
}: ITagHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTagName, setEditedTagName] = useState(tagName);
  const [updateTag] = tagsApi.useUpdateTagMutation();

  const cancelEditing = () => {
    setEditedTagName(tagName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveTagName();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditedTagName(tagName);
  };

  const saveTagName = () => {
    if (editedTagName.trim() !== "" && editedTagName !== tagName) {
      updateTag({
        id: tagId,
        updates: { name: editedTagName.trim() },
      });
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <LeftHeader>
      <div className="flex items-center py-4">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={editedTagName}
                onChange={(e) => setEditedTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-bold bg-transparent border-none focus:outline-none w-full"
                data-testid="tag-name-input"
              />
              <button
                onClick={saveTagName}
                className="ml-1 p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors"
                aria-label="Save tag name"
              >
                <Check size={18} />
              </button>
              <button
                onClick={cancelEditing}
                className="ml-1 p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                aria-label="Cancel editing"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <h1
                onClick={startEditing}
                className="font-bold cursor-pointer rounded-md hover:underline transition-colors"
                title="Click to edit"
              >
                {tagName}
              </h1>

              <div className="relative group">
                <button
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Tag information"
                >
                  <Info size={12} />
                </button>

                <div className="absolute left-0 mt-2 z-10 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col gap-3">
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 rounded-md">
                      {noteCount} {noteCount === 1 ? "note" : "notes"}
                    </div>

                    {activeCluster && (
                      <div className="flex flex-col gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-2">
                          <Calendar size={14} className="text-indigo-500" />
                          <span>
                            Created{" "}
                            {format(
                              new Date(activeCluster.created_at),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock size={14} className="text-amber-500" />
                          <span>
                            Updated{" "}
                            {format(
                              new Date(activeCluster.updated_at),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </LeftHeader>
  );
}
