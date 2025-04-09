"use client";

import { useTagMergeDialog } from "@/hooks/use-tag-merge-dialog";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { notesApi } from "@/lib/redux/services/notesApi";
import {
  setSearchQuery,
  setSelectedCategory,
} from "@/lib/redux/slices/searchSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchBox, SearchResults } from "./_components";

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
  category: string;
  zone: string;
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

export default function SearchPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [skip, setSkip] = useState(true); // Skip initial search
  const storedSearchQuery = useAppSelector((state) => state.search.query);
  const storedSelectedCategory = useAppSelector(
    (state) => state.search.selectedCategory
  );
  const [searchQuery, setLocalSearchQuery] = useState(storedSearchQuery || "");
  const [selectedCategory, setLocalSelectedCategory] = useState(
    storedSelectedCategory
  );

  // Use the existing API hooks
  const { isLoading: isClustersLoading, data: clustersData } =
    clustersApi.useGetClustersQuery({ page: 1, limit: 100 });
  const { data: searchData, isLoading: isSearching } =
    notesApi.useSearchNotesQuery(
      {
        query: searchQuery,
        category: selectedCategory,
      },
      { skip }
    );

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
        })) as (Cluster & { type: string })[])
    : [];

  // Access our tag merge dialog hook
  const {
    isLoading: isRefining,
    getMergeSuggestions,
    TagMergeDialogComponent,
  } = useTagMergeDialog();

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

  // When selected category changes, update Redux state
  useEffect(() => {
    dispatch(setSelectedCategory(selectedCategory));
  }, [selectedCategory, dispatch]);

  // Handler for category selection
  const handleCategorySelect = (category: string | null) => {
    setLocalSelectedCategory(category);
    if (!skip) {
      setSkip(true); // Reset skip to trigger a new search
      setTimeout(() => setSkip(false), 0); // Then search again with the new category
    }
  };

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

  // Highlight search terms in text with a simple replacement
  const highlightSearchTerm = (text: string) => {
    if (!searchQuery || !text) return text;

    // Create a safe regex pattern from the search query
    const safePattern = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safePattern})`, "gi");

    // Replace with a colored span for highlighting
    return text.replace(
      regex,
      '<span class="text-blue-600 font-semibold">$1</span>'
    );
  };

  // Create safe HTML for display
  const createMarkup = (content: string) => {
    return { __html: content };
  };

  const handleItemClick = (
    item: Note | Cluster | { type: string; id: number }
  ) => {
    if (item.type === "cluster") {
      const cluster = item as Cluster & { type: string };
      router.push(
        `/tag-family/${encodeURIComponent(
          cluster.tag_family
        )}?category=${encodeURIComponent(cluster.category)}`
      );
    } else {
      router.push(`/note/${item.id}`);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">
        Search Notes & Clusters
      </h1>

      <SearchBox
        searchQuery={searchQuery}
        setSearchQuery={setLocalSearchQuery}
        handleSearch={handleSearch}
        isSearching={isSearching}
        isRefining={isRefining}
        handleRefine={handleRefine}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      {/* Include the tag merge dialog component */}
      {TagMergeDialogComponent}

      <SearchResults
        searchQuery={searchQuery}
        isSearching={isSearching}
        isLoading={isLoading}
        isClustersLoading={isClustersLoading}
        filteredClusters={filteredClusters}
        notes={searchData?.notes as unknown as Note[]}
        handleItemClick={handleItemClick}
        formatDate={formatDate}
        createMarkup={createMarkup}
        highlightSearchTerm={highlightSearchTerm}
        truncateContent={truncateContent}
      />
    </div>
  );
}
