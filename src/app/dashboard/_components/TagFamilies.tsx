import { format } from "date-fns";
import { Tag } from "lucide-react";
import { CommonProps, TagFamily } from "./types";

interface TagFamiliesProps extends Pick<CommonProps, "onTagFamilyClick"> {
  tagFamilies: TagFamily[];
  isLoading: boolean;
  error: unknown;
}

export function TagFamilies({
  tagFamilies,
  isLoading,
  error,
  onTagFamilyClick,
}: TagFamiliesProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Tag Families</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[90px] animate-pulse rounded-md bg-blue-50/50"
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-2 text-red-500 text-sm">
          Failed to load tag families
        </div>
      ) : tagFamilies.length === 0 ? (
        <div className="p-2 text-center text-muted-foreground text-sm">
          No tag families found
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {tagFamilies.map((tagFamily) => (
            <TagFamilyCard
              key={tagFamily.id}
              tagFamily={tagFamily}
              onClick={() => onTagFamilyClick(tagFamily.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TagFamilyCardProps {
  tagFamily: TagFamily;
  onClick: () => void;
}

function TagFamilyCard({ tagFamily, onClick }: TagFamilyCardProps) {
  return (
    <div
      className="border rounded-md p-2.5 cursor-pointer hover:shadow-sm hover:border-blue-400 transition-all bg-blue-50/30"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <h3 className="font-medium text-sm truncate text-blue-700 mb-1.5">
          {tagFamily.tag}
        </h3>
        <div className="flex items-center justify-between mb-auto">
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-medium text-blue-800">
              {tagFamily.clusters?.length || 0}
            </span>
            <span className="text-[10px] text-blue-600">
              {tagFamily.clusters?.length === 1 ? " cluster" : " clusters"}
            </span>
          </div>
          {tagFamily.todo_items && tagFamily.todo_items.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {tagFamily.todo_items.length} todo
              {tagFamily.todo_items.length > 1 && "s"}
            </span>
          )}
        </div>
        <time className="text-[10px] text-muted-foreground mt-1">
          {format(new Date(tagFamily.created_at), "MMM d")}
        </time>
      </div>
    </div>
  );
}
