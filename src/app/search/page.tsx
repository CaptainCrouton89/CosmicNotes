"use client";

import { notesApi } from "@/lib/redux/services/notesApi";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [skip, setSkip] = useState(true);

  const { data, isFetching: isSearching } = notesApi.useSearchNotesQuery(
    { query: searchQuery },
    { skip }
  );

  // Access notes from data.notes
  const searchResults = data?.notes || [];

  const [refineTags] = tagsApi.useRefineTagsMutation();
  const [isRefining, setIsRefining] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    setSkip(false);
  };

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      await refineTags().unwrap();
      toast.success("Tags refined successfully");
    } catch (error) {
      console.error("Error refining tags:", error);
      toast.error("Failed to refine tags");
    } finally {
      setIsRefining(false);
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search Notes</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={handleRefine}
            disabled={isRefining}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            {isRefining ? "Refining..." : "Refine Tags"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {searchResults.map((note) => (
          <div
            key={note.id}
            className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer"
            onClick={() => router.push(`/note/${note.id}`)}
          >
            <div className="text-lg mb-2">{note.content}</div>
            <div className="text-sm text-gray-500">
              Created {formatDate(note.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
