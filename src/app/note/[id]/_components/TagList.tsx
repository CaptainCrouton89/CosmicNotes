import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Tag as TagIcon, X } from "lucide-react";

interface Tag {
  id: number;
  name: string;
}

interface TagListProps {
  tags: Tag[];
  onDeleteTag: (tagId: number) => void;
  deletingTag: number | null;
  onAddTags?: () => void;
}

export function TagList({
  tags,
  onDeleteTag,
  deletingTag,
  onAddTags,
}: TagListProps) {
  console.log("tags", tags);
  return (
    <>
      <TagIcon className="h-4 w-4" />
      <div className="flex flex-wrap gap-2 items-center">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="text-xs flex items-center gap-1.5 pr-1 group"
          >
            <span>{tag.name}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDeleteTag(tag.id);
              }}
              className="ml-1 p-0.5 rounded-full opacity-0 group-hover:opacity-70 hover:opacity-100 hover:bg-muted-foreground/10 transition-opacity"
              title="Remove tag"
              aria-label={`Remove tag ${tag.name}`}
              disabled={deletingTag === tag.id}
            >
              {deletingTag === tag.id ? (
                <div className="w-3 h-3 border-t-2 border-muted-foreground rounded-full animate-spin"></div>
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          </Badge>
        ))}

        {onAddTags && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTags}
            className="text-xs h-6 px-2 gap-1 ml-1"
          >
            <Plus className="h-3 w-3" />
            {tags.length === 0 ? "Add Tags" : "Add More"}
          </Button>
        )}
      </div>
    </>
  );
}
