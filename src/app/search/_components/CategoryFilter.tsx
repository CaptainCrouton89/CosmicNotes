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
  Filter,
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

interface CategoryFilterProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const getCategoryIcon = useCallback(
    (categoryName: Category, selected?: boolean) => {
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
      }
    },
    []
  );

  const getCategoryColor = (category: Category | null) => {
    switch (category) {
      case "to-do":
        return "bg-blue-50 text-blue-700 hover:bg-blue-100";
      case "scratchpad":
        return "bg-green-50 text-green-700 hover:bg-green-100";
      case "collection":
        return "bg-pink-50 text-pink-700 hover:bg-pink-100";
      case "brainstorm":
        return "bg-yellow-50 text-yellow-700 hover:bg-yellow-100";
      case "journal":
        return "bg-purple-50 text-purple-700 hover:bg-purple-100";
      case "meeting":
        return "bg-red-50 text-red-700 hover:bg-red-100";
      case "research":
        return "bg-teal-50 text-teal-700 hover:bg-teal-100";
      case "learning":
        return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100";
      case "feedback":
        return "bg-orange-50 text-orange-700 hover:bg-orange-100";
      default:
        return "";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-2 flex items-center justify-center ${getCategoryColor(
            selectedCategory
          )}`}
        >
          <Filter className="h-4 w-4" />
          {selectedCategory || "All Categories"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {CATEGORIES.map((cat) => (
          <DropdownMenuItem key={cat} onClick={() => onSelectCategory(cat)}>
            {getCategoryIcon(cat, true)}
            <span className="ml-2">{cat}</span>
            {selectedCategory === cat && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
