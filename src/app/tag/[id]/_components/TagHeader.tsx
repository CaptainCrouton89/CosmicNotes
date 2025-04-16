import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { setActiveCategory } from "@/lib/redux/slices/clusterSlice";
import { capitalize } from "@/lib/utils";
import { CATEGORIES, Category, Cluster } from "@/types/types";
import { format } from "date-fns";
import { Calendar, Check, Clock, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TagHeaderProps {
  noteCount: number;
  tagName: string;
  tagId: number;
  activeCluster: Omit<Cluster, "tag"> | null;
}

export function TagHeader({ noteCount, tagName, tagId }: TagHeaderProps) {
  const dispatch = useAppDispatch();
  const { activeCategory, activeCluster, validNoteCategories } = useAppSelector(
    (state) => state.cluster
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedTagName, setEditedTagName] = useState(tagName);
  const inputRef = useRef<HTMLInputElement>(null);
  const [updateTag] = tagsApi.useUpdateTagMutation();

  // Handle category change and update URL
  const handleCategoryChange = (category: Category) => {
    // First update the UI state
    dispatch(setActiveCategory(category));

    // Then update URL without triggering a full navigation using the native History API
    const url = new URL(window.location.href);
    url.searchParams.set("category", category);
    window.history.replaceState({ path: url.href }, "", url.href);
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

  const cancelEditing = () => {
    setEditedTagName(tagName);
    setIsEditing(false);
  };

  // Focus input when editing begins
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle keyboard events for input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveTagName();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <div className="mb-2 md:mb-4">
      {/* Compact header with title and metadata */}
      <div className="flex flex-wrap items-baseline gap-x-2 my-2">
        {isEditing ? (
          <div className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={editedTagName}
              onChange={(e) => setEditedTagName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-2xl font-bold py-1 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="tag-name-input"
            />
            <button
              onClick={saveTagName}
              className="ml-2 p-1 text-green-600 hover:bg-green-100 rounded-full"
              aria-label="Save tag name"
            >
              <Check size={18} />
            </button>
            <button
              onClick={cancelEditing}
              className="ml-1 p-1 text-red-600 hover:bg-red-100 rounded-full"
              aria-label="Cancel editing"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">{tagName}</h1>
            <button
              onClick={startEditing}
              className="ml-2 p-1 text-gray-500 hover:bg-gray-100 rounded-full"
              aria-label="Edit tag name"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}
        <span className="text-muted-foreground">({noteCount} notes)</span>

        {activeCluster && (
          <div className="flex items-center text-xs text-gray-500 ml-auto">
            <span className="flex items-center gap-1 mr-3">
              <Calendar size={14} />
              {format(new Date(activeCluster.created_at), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {format(new Date(activeCluster.updated_at), "MMM d, yyyy")}
            </span>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex items-center">
        <Tabs
          defaultValue={activeCategory || "scratchpad"}
          value={activeCategory || "scratchpad"}
          onValueChange={(value) => handleCategoryChange(value as Category)}
          className="w-full"
        >
          <TabsList className="h-auto min-h-8 flex flex-wrap gap-1 pt-0.5 pb-0">
            {CATEGORIES.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                disabled={!validNoteCategories.includes(category)}
                className={`text-xs px-1 sm:px-2 md:px-3 lg:px-4 py-1 h-7 mb-1 ${
                  activeCategory === category ? "font-semibold" : ""
                } ${
                  !validNoteCategories.includes(category)
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                data-has-content={validNoteCategories
                  .includes(category)
                  .toString()}
              >
                {capitalize(category)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
