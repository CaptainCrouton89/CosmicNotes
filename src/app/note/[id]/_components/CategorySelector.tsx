import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORIES, Category } from "@/types/types";
import {
  Book,
  Check,
  FolderKanban,
  GraduationCap,
  Layers,
  Lightbulb,
  ListTodo,
  MessageSquare,
  Pencil,
  Search,
  Users,
} from "lucide-react";
import { useCallback } from "react";

interface CategorySelectorProps {
  category?: Category;
  updating: boolean;
  onUpdateCategory: (category: Category) => void;
}

export function CategorySelector({
  category,
  updating,
  onUpdateCategory,
}: CategorySelectorProps) {
  const getCategoryIcon = useCallback(
    (categoryName: string | undefined, selected?: boolean) => {
      const size = selected ? "h-4 w-4" : "h-3.5 w-3.5";

      switch (categoryName) {
        case "to-do":
          return (
            <ListTodo
              className={`${size} ${
                selected ? "text-blue-600" : "text-muted-foreground"
              }`}
            />
          );
        case "scratchpad":
          return (
            <Pencil
              className={`${size} ${
                selected ? "text-green-600" : "text-muted-foreground"
              }`}
            />
          );
        case "collection":
          return (
            <Layers
              className={`${size} ${
                selected ? "text-pink-600" : "text-muted-foreground"
              }`}
            />
          );
        case "brainstorm":
          return (
            <Lightbulb
              className={`${size} ${
                selected ? "text-yellow-600" : "text-muted-foreground"
              }`}
            />
          );
        case "journal":
          return (
            <Book
              className={`${size} ${
                selected ? "text-purple-600" : "text-muted-foreground"
              }`}
            />
          );
        case "meeting":
          return (
            <Users
              className={`${size} ${
                selected ? "text-red-600" : "text-muted-foreground"
              }`}
            />
          );
        case "research":
          return (
            <Search
              className={`${size} ${
                selected ? "text-teal-600" : "text-muted-foreground"
              }`}
            />
          );
        case "learning":
          return (
            <GraduationCap
              className={`${size} ${
                selected ? "text-indigo-600" : "text-muted-foreground"
              }`}
            />
          );
        case "feedback":
          return (
            <MessageSquare
              className={`${size} ${
                selected ? "text-orange-600" : "text-muted-foreground"
              }`}
            />
          );
        default:
          return (
            <FolderKanban className={`${size} text-muted-foreground/50`} />
          );
      }
    },
    []
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-6 w-8 text-xs sm:w-auto sm:px-3 flex items-center justify-center gap-2 ${
            category === "to-do"
              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
              : category === "scratchpad"
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : category === "collection"
              ? "bg-pink-50 text-pink-700 hover:bg-pink-100"
              : category === "brainstorm"
              ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              : category === "journal"
              ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
              : category === "meeting"
              ? "bg-red-50 text-red-700 hover:bg-red-100"
              : category === "research"
              ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
              : category === "learning"
              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : category === "feedback"
              ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
              : ""
          }`}
        >
          {updating ? (
            <div className="w-3 h-3 border-t-2 border-muted-foreground rounded-full animate-spin" />
          ) : (
            <>
              {getCategoryIcon(category)}
              <span className="hidden sm:inline capitalize">
                {category || "Uncategorized"}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {CATEGORIES.map((cat) => (
          <DropdownMenuItem key={cat} onClick={() => onUpdateCategory(cat)}>
            {getCategoryIcon(cat, true)}
            <span className="ml-2 capitalize">{cat}</span>
            {category === cat && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
