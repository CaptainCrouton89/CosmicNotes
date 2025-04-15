import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Tag {
  id: number;
  name: string;
}

interface TagListProps {
  tags: Tag[];
  onDeleteTag: (tagId: number) => void;
  deletingTag: number | null;
  onAddTags?: (tag: string) => void;
}

export function TagList({
  tags,
  onDeleteTag,
  deletingTag,
  onAddTags,
}: TagListProps) {
  const [newTag, setNewTag] = useState("");
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tags.map((tag) => (
        <Link key={tag.id} href={`/tag/${tag.id}`}>
          <Badge
            variant="secondary"
            className="text-xs flex items-center gap-1.5 pr-1 group cursor-default transition-all duration-300 hover:bg-primary/20 cursor-pointer"
          >
            <span>{tag.name}</span>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteTag(tag.id);
              }}
              className="ml-1 p-0.5 rounded-full opacity-0 group-hover:opacity-70 hover:opacity-100 hover:bg-muted-foreground/10 transition-opacity cursor-pointer"
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
        </Link>
      ))}

      {onAddTags && (
        <Input
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAddTags(newTag);
              setNewTag("");
            }
          }}
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          type="text"
          placeholder="Add tag..."
          className="text-xs h-6 px-2 gap-1 ml-1 w-24"
        />
      )}
    </div>
  );
}
