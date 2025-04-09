"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTagMergeDialog } from "@/hooks/use-tag-merge-dialog";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { notesApi } from "@/lib/redux/services/notesApi";
import { setSearchQuery } from "@/lib/redux/slices/searchSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Define types for the cosmic tags
interface CosmicTag {
  tag: string;
  confidence: number;
  created_at: string;
}

// Define types for notes and clusters
interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  cosmic_tags?: CosmicTag[];
  type?: string;
}

interface Cluster {
  id: number;
  tag_family: string;
  category: string;
  tag_count: number;
  summary: string;
  created_at: string;
  updated_at: string;
  embedding: string;
  type?: string;
}

// Combined search result type
type SearchResult = (Note | Cluster) & { type: string };

export default function SearchPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [skip, setSkip] = useState(true); // Skip initial search
  const storedSearchQuery = useAppSelector((state) => state.search.query);
  const [searchQuery, setLocalSearchQuery] = useState(storedSearchQuery || "");

  // Use the existing API hooks
  const { isLoading: isClustersLoading, data: clustersData } =
    clustersApi.useGetClustersQuery({ page: 1, limit: 100 });
  const { data: searchData, isLoading: isSearching } =
    notesApi.useSearchNotesQuery({ query: searchQuery }, { skip });

  const clusters = clustersData?.clusters || [];
  const isLoading = isSearching;

  // Filter clusters based on search query
  const filteredClusters = searchQuery
    ? (clusters
        .filter((cluster) =>
          cluster.tag_family.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((cluster) => ({
          ...cluster,
          type: "cluster",
        })) as SearchResult[])
    : [];

  // Access our tag merge dialog hook
  const {
    isLoading: isRefining,
    getMergeSuggestions,
    TagMergeDialogComponent,
  } = useTagMergeDialog();

  // Combine clusters and notes for display
  const getCombinedSearchResults = (): SearchResult[] => {
    if (!searchQuery) return [];
    if (!searchData || !searchData.notes) return filteredClusters;

    // Cast notes array to match our Note type
    const notes = searchData.notes as unknown as Note[];

    const noteResults = notes.map((note) => ({
      ...note,
      type: "note",
    })) as SearchResult[];

    // Return clusters first, then notes
    return [...filteredClusters, ...noteResults];
  };

  const combinedResults = getCombinedSearchResults();

  // Sync with Redux when data changes
  useEffect(() => {
    if (searchData && searchData.notes) {
      // This will be handled by the extraReducer in searchSlice
    }
  }, [searchData, dispatch]);

  // When search query changes, update Redux state but don't trigger API call
  useEffect(() => {
    dispatch(setSearchQuery(searchQuery));
  }, [searchQuery, dispatch]);

  // Search button only triggers the API call for notes
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    // Only this part triggers the actual API call
    setSkip(false);
  };

  const handleRefine = () => {
    getMergeSuggestions();
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

  const truncateContent = (
    content: string | null | undefined,
    maxLength = 150
  ) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const handleItemClick = (item: SearchResult) => {
    if (item.type === "cluster") {
      router.push(`/cluster/${item.id}`);
    } else {
      router.push(`/note/${item.id}`);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">
        Search Notes & Clusters
      </h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search notes and clusters..."
            className="flex-1 px-4 py-3 text-lg"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 h-auto"
            >
              {isSearching ? "Searching Notes..." : "Search Notes"}
            </Button>
            <Button
              onClick={handleRefine}
              disabled={isRefining}
              variant="secondary"
              className="px-6 py-3 h-auto"
            >
              {isRefining ? "Analyzing Tags..." : "Refine Tags"}
            </Button>
          </div>
        </div>
      </form>

      {/* Include the tag merge dialog component */}
      {TagMergeDialogComponent}

      {isClustersLoading && (
        <div className="text-center p-4">
          <p className="text-gray-500">Loading clusters...</p>
        </div>
      )}

      {searchQuery && !isClustersLoading && filteredClusters.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Matching Clusters</h2>
        </div>
      )}

      <div className="space-y-6">
        {combinedResults.map((item, index) => (
          <div
            key={`${item.type}-${item.id}-${index}`}
            className={`p-5 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer ${
              item.type === "cluster" ? "bg-blue-50" : ""
            }`}
            onClick={() => handleItemClick(item)}
          >
            {/* Item Type Indicator */}
            <div className="flex justify-between mb-2">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  item.type === "cluster"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {item.type === "cluster" ? "CLUSTER" : "NOTE"}
              </span>
              {item.type === "cluster" && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {(item as Cluster).category}
                </span>
              )}
            </div>

            {/* Cluster-specific content */}
            {item.type === "cluster" && (
              <>
                <h3 className="text-xl font-semibold mb-3">
                  {(item as Cluster).tag_family}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({(item as Cluster).tag_count} notes)
                  </span>
                </h3>
                <div className="text-md mb-3 markdown">
                  <Markdown
                    remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                  >
                    {truncateContent((item as Cluster).summary)}
                  </Markdown>
                </div>
              </>
            )}

            {/* Note-specific content */}
            {item.type === "note" && (
              <>
                {(item as Note).cosmic_tags && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(item as Note).cosmic_tags?.map(
                      (tag: CosmicTag, tagIndex: number) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                        >
                          {tag.tag}
                        </span>
                      )
                    )}
                  </div>
                )}
                <div className="text-md mb-3 markdown">
                  <Markdown
                    remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                  >
                    {truncateContent((item as Note).content)}
                  </Markdown>
                </div>
              </>
            )}

            {/* Common footer */}
            <div className="text-sm text-gray-500">
              Created {formatDate(item.created_at)}
            </div>
          </div>
        ))}

        {searchQuery &&
          combinedResults.length === 0 &&
          !isSearching &&
          !isClustersLoading && (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-gray-500">No results found</p>
            </div>
          )}

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-5 border rounded-lg">
                <Skeleton className="h-4 w-20 mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
