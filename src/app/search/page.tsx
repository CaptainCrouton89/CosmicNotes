"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Note {
  id: number;
  content: string;
  created_at: string;
  metadata: Record<string, any>;
  similarity?: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/note/search?query=${encodeURIComponent(searchQuery)}`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.notes || []);
      } else {
        console.error("Search failed");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching notes:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Search Notes</h1>
        <p className="text-muted-foreground">
          Search through your notes using semantic similarity.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex w-full max-w-lg items-center space-x-2"
      >
        <Input
          type="search"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
        {searchResults.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Search Results</h2>

        {searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map((note) => (
              <div key={note.id} className="p-4 border rounded-md bg-card">
                <div className="text-sm text-muted-foreground mb-1">
                  {formatDate(note.created_at)}
                  {note.similarity !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm text-xs">
                      {Math.round(note.similarity * 100)}% match
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? "No matching notes found"
              : "Enter a query to search your notes"}
          </div>
        )}
      </div>
    </div>
  );
}
