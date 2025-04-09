import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form onSubmit={handleSearch} className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes and clusters..."
            className="flex-1 px-4 py-3 text-lg focus-visible:ring-blue-500"
          />
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 h-auto bg-blue-600 hover:bg-blue-700"
          >
            {isSearching ? "Searching Notes..." : "Search Notes"}
          </Button>
          <Button
            onClick={handleRefine}
            disabled={isRefining}
            variant="secondary"
            className="px-6 py-3 h-auto hover:bg-gray-200"
          >
            {isRefining ? "Analyzing Tags..." : "Refine Tags"}
          </Button>
        </div>
      </div>
    </form>
  );
};
