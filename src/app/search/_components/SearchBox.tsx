import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category } from "@/types/types";
import { SearchIcon } from "lucide-react";
import React from "react";
import { CategoryFilter } from "./CategoryFilter";

interface SearchBoxProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isSearching: boolean;
  isRefining: boolean;
  handleRefine: () => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearching,
  isRefining,
  handleRefine,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <form onSubmit={handleSearch} className="mb-4 sm:mb-8">
      <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row">
        <div className="flex-1 flex gap-1 sm:gap-2">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes and clusters..."
            className="flex-1 px-2 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus-visible:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 px-2 sm:px-4"
          >
            {isSearching ? (
              <span className="text-xs sm:text-sm">Searching...</span>
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}
          </Button>
          <CategoryFilter
            selectedCategory={selectedCategory as Category}
            onSelectCategory={onSelectCategory}
          />
        </div>
        <div className="flex flex-col gap-1 sm:gap-2 sm:flex-row">
          <Button
            onClick={handleRefine}
            disabled={isRefining}
            variant="secondary"
            size="sm"
            className="text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-4 h-auto"
          >
            {isRefining ? "Analyzing Tags..." : "Refine Tags"}
          </Button>
        </div>
      </div>
    </form>
  );
};
