"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { notesApi } from "@/lib/redux/services/notesApi";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { setSearchQuery } from "@/lib/redux/slices/searchSlice";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

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
  tag: string;
  tag_count: number;
  summary: string;
  created_at: string;
  updated_at: string;
  type?: string;
}

// Combined search result type
type SearchResult = (Note | Cluster) & { type: string };

export default function SearchPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Get search state from Redux
  const {
    query: savedQuery,
    results: savedResults,
    hasSearched,
  } = useAppSelector((state) => state.search);

  // Get clusters from Redux
  const { clusters } = useAppSelector((state) => state.cluster);

  // Local state for controlled input
  const [searchQuery, setLocalSearchQuery] = useState(savedQuery);

  // Skip initial fetch if no previous search was made
  const [skip, setSkip] = useState(!hasSearched);

  // Fetch clusters if they haven't been loaded yet
  const { isLoading: isClustersLoading } = clustersApi.useGetClustersQuery(
    { page: 1, limit: 100 },
    { skip: clusters.length > 0 }
  );

  const { data, isFetching: isSearching } = notesApi.useSearchNotesQuery(
    { query: savedQuery },
    { skip }
  );

  // Real-time filtering of clusters based on current search input
  const filteredClusters = useMemo(() => {
    if (!searchQuery) return [];

    const lowerQuery = searchQuery.toLowerCase();
    return clusters
      .filter((cluster) => {
        return (
          cluster.tag.toLowerCase().includes(lowerQuery) ||
          (cluster.summary &&
            cluster.summary.toLowerCase().includes(lowerQuery))
        );
      })
      .map((cluster) => ({
        ...cluster,
        type: "cluster",
      }));
  }, [clusters, searchQuery]);

  // Combine results - using filtered clusters based on current input (not saved query)
  const getCombinedSearchResults = (): SearchResult[] => {
    const noteResults = (data?.notes || savedResults || []).map((note) => ({
      ...note,
      type: "note",
    })) as SearchResult[];

    // Return clusters first, then notes
    return [...(filteredClusters as SearchResult[]), ...noteResults];
  };

  const combinedResults = getCombinedSearchResults();

  // Sync with Redux when data changes
  useEffect(() => {
    if (data && data.notes) {
      // This will be handled by the extraReducer in searchSlice
    }
  }, [data, dispatch]);

  // When search query changes, update Redux state but don't trigger API call
  useEffect(() => {
    dispatch(setSearchQuery(searchQuery));
  }, [searchQuery, dispatch]);

  const [refineTags] = tagsApi.useRefineTagsMutation();
  const [isRefining, setIsRefining] = useState(false);

  // Search button only triggers the API call for notes
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    // Only this part triggers the actual API call
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search Notes & Clusters</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search notes and clusters..."
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "Searching Notes..." : "Search Notes"}
          </Button>
          <Button
            onClick={handleRefine}
            disabled={isRefining}
            variant="secondary"
          >
            {isRefining ? "Refining..." : "Refine Tags"}
          </Button>
        </div>
      </form>

      {isClustersLoading && (
        <div className="text-center p-4">
          <p className="text-gray-500">Loading clusters...</p>
        </div>
      )}

      {searchQuery && !isClustersLoading && filteredClusters.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Matching Clusters</h2>
        </div>
      )}

      <div className="space-y-4">
        {combinedResults.map((item, index) => (
          <div
            key={`${item.type}-${item.id}-${index}`}
            className={`p-4 border rounded-lg hover:border-blue-500 cursor-pointer ${
              item.type === "cluster" ? "bg-blue-50" : ""
            }`}
            onClick={() => handleItemClick(item)}
          >
            {/* Item Type Indicator */}
            <div className="flex justify-between mb-1">
              <span
                className={`text-xs font-medium ${
                  item.type === "cluster" ? "text-blue-700" : "text-gray-500"
                }`}
              >
                {item.type === "cluster" ? "CLUSTER" : "NOTE"}
              </span>
            </div>

            {/* Cluster-specific content */}
            {item.type === "cluster" && (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  {(item as Cluster).tag}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({(item as Cluster).tag_count} notes)
                  </span>
                </h3>
                <div className="text-md mb-2 markdown">
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
                <div className="text-md mb-2 markdown">
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
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                No results found for &quot;{searchQuery}&quot;
              </p>
              {!hasSearched && (
                <p className="text-gray-500 mt-2">
                  Click &quot;Search Notes&quot; to search note content
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
