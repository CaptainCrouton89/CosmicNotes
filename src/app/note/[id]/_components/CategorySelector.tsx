import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const CATEGORIES = [
  "To-Do",
  "Scratchpad",
  "Collections",
  "Brainstorm",
  "Journal",
  "Meeting",
  "Research",
  "Learning",
  "Feedback",
];

interface CategorySelectorProps {
  category?: string;
  updating: boolean;
  onUpdateCategory: (category: string) => void;
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
        case "To-Do":
          return (
            <ListTodo
              className={`${size} ${
                selected ? "text-blue-600" : "text-muted-foreground"
              }`}
            />
          );
        case "Scratchpad":
          return (
            <Pencil
              className={`${size} ${
                selected ? "text-green-600" : "text-muted-foreground"
              }`}
            />
          );
        case "Collections":
          return (
            <Layers
              className={`${size} ${
                selected ? "text-pink-600" : "text-muted-foreground"
              }`}
            />
          );
        case "Brainstorm":
          return (
            <Lightbulb
              className={`${size} ${
                selected ? "text-yellow-600" : "text-muted-foreground"
              }`}
            />
          );
        case "Journal":
          return (
            <Book
              className={`${size} ${
                selected ? "text-purple-600" : "text-muted-foreground"
              }`}
            />
          );
        case "Meeting":
          return (
            <Users
              className={`${size} ${
                selected ? "text-red-600" : "text-muted-foreground"
              }`}
            />
          );
        case "Research":
          return (
            <Search
              className={`${size} ${
                selected ? "text-teal-600" : "text-muted-foreground"
              }`}
            />
          );
        case "Learning":
          return (
            <GraduationCap
              className={`${size} ${
                selected ? "text-indigo-600" : "text-muted-foreground"
              }`}
            />
          );
        case "Feedback":
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
          className={`h-6 w-8 px-1 flex items-center justify-center ${
            category === "To-Do"
              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
              : category === "Scratchpad"
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : category === "Collections"
              ? "bg-pink-50 text-pink-700 hover:bg-pink-100"
              : category === "Brainstorm"
              ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              : category === "Journal"
              ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
              : category === "Meeting"
              ? "bg-red-50 text-red-700 hover:bg-red-100"
              : category === "Research"
              ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
              : category === "Learning"
              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : category === "Feedback"
              ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
              : ""
          }`}
        >
          {updating ? (
            <div className="w-3 h-3 border-t-2 border-muted-foreground rounded-full animate-spin" />
          ) : (
            getCategoryIcon(category)
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => onUpdateCategory("")}>
          <span>None</span>
          {!category && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        {CATEGORIES.map((cat) => (
          <DropdownMenuItem key={cat} onClick={() => onUpdateCategory(cat)}>
            {getCategoryIcon(cat, true)}
            <span className="ml-2">{cat}</span>
            {category === cat && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
