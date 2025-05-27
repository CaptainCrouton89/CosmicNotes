import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { tagsApi } from "@/lib/redux/services/tagsApi";

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { data: allTags = [] } = tagsApi.useGetAllTagsQuery();
  
  // Filter existing tags and get suggestions
  const suggestions = allTags
    .filter(tag => 
      tag.name.toLowerCase().includes(newTag.toLowerCase()) &&
      !tags.some(existingTag => existingTag.id === tag.id)
    )
    .slice(0, 8); // Limit to 8 suggestions
    
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelectSuggestion = (suggestion: typeof allTags[0]) => {
    if (onAddTags) {
      onAddTags(suggestion.name);
      setNewTag("");
      setShowSuggestions(false);
      setSelectedSuggestionIndex(0);
    }
  };
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tags.map((tag) => (
        <Link key={tag.id} href={`/tag/${tag.id}`}>
          <Badge
            variant="secondary"
            className="text-xs flex items-center gap-1.5 pr-1 group cursor-default transition-all duration-300 hover:bg-primary/10 cursor-pointer"
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
        <div className="relative">
          <Input
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (showSuggestions && suggestions.length > 0) {
                  handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
                } else if (newTag.trim()) {
                  onAddTags(newTag);
                  setNewTag("");
                  setShowSuggestions(false);
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                  prev < suggestions.length - 1 ? prev + 1 : prev
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            value={newTag}
            onChange={(e) => {
              setNewTag(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
              setSelectedSuggestionIndex(0);
            }}
            onFocus={() => setShowSuggestions(newTag.length > 0)}
            type="text"
            placeholder="Add tag..."
            className="text-xs h-6 px-2 gap-1 ml-1 w-24"
            autoComplete="off"
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 mt-1 w-48 bg-popover border rounded-md shadow-md overflow-hidden"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`w-full px-2 py-1.5 text-xs text-left hover:bg-accent transition-colors ${
                    index === selectedSuggestionIndex ? 'bg-accent' : ''
                  }`}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <div className="font-medium">{suggestion.name}</div>
                  <div className="text-muted-foreground">
                    {suggestion.note_count} note{suggestion.note_count !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
