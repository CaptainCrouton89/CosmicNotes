"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { notesApi } from "@/lib/redux/services/notesApi";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { clearSearch, setSearchQuery } from "@/lib/redux/slices/searchSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

export default function SearchPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Get search state from Redux
  const {
    query: savedQuery,
    results: savedResults,
    hasSearched,
  } = useAppSelector((state) => state.search);

  // Local state for controlled input
  const [searchQuery, setLocalSearchQuery] = useState(savedQuery);

  // Skip initial fetch if no previous search was made
  const [skip, setSkip] = useState(!hasSearched);

  const { data, isFetching: isSearching } = notesApi.useSearchNotesQuery(
    { query: savedQuery },
    { skip }
  );

  // Sync with Redux when data changes
  useEffect(() => {
    if (data && data.notes) {
      // This will be handled by the extraReducer in searchSlice
    }
  }, [data, dispatch]);

  // Use the saved results or the fresh data
  const searchResults =
    savedResults.length > 0 && !data ? savedResults : data?.notes || [];

  const [refineTags] = tagsApi.useRefineTagsMutation();
  const [isRefining, setIsRefining] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }

    // Save the query to Redux
    dispatch(setSearchQuery(searchQuery));
    setSkip(false);
  };

  const handleClearSearch = () => {
    dispatch(clearSearch());
    setLocalSearchQuery("");
    setSkip(true);
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

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search Notes</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
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
          {hasSearched && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Clear
            </button>
          )}
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
            <div className="text-lg mb-2 markdown">
              <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
                {truncateContent(note.content)}
              </Markdown>
            </div>
            <div className="text-sm text-gray-500">
              Created {formatDate(note.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
