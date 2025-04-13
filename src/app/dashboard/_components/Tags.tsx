import { Tag } from "@/types/types";
import { format } from "date-fns";
import { Tag as TagIcon } from "lucide-react";
import { CommonProps } from "./types";

interface TagsProps extends Pick<CommonProps, "onTagClick"> {
  tags: Tag[];
  isLoading: boolean;
  error: unknown;
}

export function Tags({ tags, isLoading, error, onTagClick }: TagsProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Tags</h2>
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
        <div className="p-2 text-red-500 text-sm">Failed to load tags</div>
      ) : tags.length === 0 ? (
        <div className="p-2 text-center text-muted-foreground text-sm">
          No tags found
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {tags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onClick={() => onTagClick(tag.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TagCardProps {
  tag: Tag;
  onClick: () => void;
}

function TagCard({ tag, onClick }: TagCardProps) {
  return (
    <div
      className="border rounded-md p-2.5 cursor-pointer hover:shadow-sm hover:border-blue-400 transition-all bg-blue-50/30"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <h3 className="font-medium text-sm truncate text-blue-700 mb-1.5">
          {tag.name}
        </h3>
        <div className="flex items-center justify-between mb-auto">
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-medium text-blue-800">
              {tag.notes?.length || 0}
            </span>
            <span className="text-[10px] text-blue-600">
              {tag.notes?.length === 1 ? " note" : " notes"}
            </span>
          </div>
          {/* {tag.items && tag.items.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {tag.items.length} todo
              {tag.items.length > 1 && "s"}
            </span>
          )} */}
        </div>
        <time className="text-[10px] text-muted-foreground mt-1">
          {format(new Date(tag.created_at), "MMM d")}
        </time>
      </div>
    </div>
  );
}
