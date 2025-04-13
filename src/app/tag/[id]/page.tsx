"use client";

import { tagsApi } from "@/lib/redux/services/tagsApi";
import {
  setChatVisibility,
  toggleChatVisibility,
} from "@/lib/redux/slices/uiSlice";
import { RootState } from "@/lib/redux/store";
import { Category, Cluster, Note } from "@/types/types";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChatButtons,
  ClusterSummary,
  EmptyState,
  ErrorState,
  GenerateClusterButton,
  LoadingState,
  RelatedNotes,
  TagHeader,
} from "./_components";
import { ChatPanel } from "./_components/ChatPanel";

export default function TagPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const tagId = parseInt(String(params.id), 10);
  const dispatch = useDispatch();

  // Use global UI state for chat visibility
  const isChatVisible = useSelector(
    (state: RootState) => state.ui.isChatVisible
  );

  // State for mobile detection and active categories
  const [, setIsMobile] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>(
    (categoryParam as Category) || "scratchpad"
  );
  const [activeCluster, setActiveCluster] = useState<Omit<
    Cluster,
    "tag"
  > | null>(null);

  // Fetch tag family data
  const {
    data: tag,
    isLoading: tagLoading,
    error: tagError,
  } = tagsApi.useGetTagQuery(tagId, {
    skip: isNaN(tagId),
  });

  // Set the initial active category when tag data is loaded
  useEffect(() => {
    if (!tag || !tag.notes || tag.notes.length === 0) return;

    // Get unique categories that have notes
    const availableCategories = [
      ...new Set(tag.notes.map((note) => note.category)),
    ] as Category[];

    if (availableCategories.length === 0) return;

    // If the category from URL params exists and has notes, use it
    if (
      categoryParam &&
      availableCategories.includes(categoryParam as Category)
    ) {
      setActiveCategory(categoryParam as Category);
    }
    // If current active category doesn't have notes, pick the first available one
    else if (!availableCategories.includes(activeCategory)) {
      setActiveCategory(availableCategories[0]);
    }
  }, [tag, categoryParam, activeCategory]);

  useEffect(() => {
    if (tag && tag.clusters && tag.clusters.length > 0) {
      // Find a cluster matching the active category if possible
      const matchingCluster = tag.clusters.find(
        (c) => c.category === activeCategory
      );
      if (matchingCluster) {
        setActiveCluster(matchingCluster);
      } else {
        setActiveCluster(null);
      }
    } else {
      setActiveCluster(null);
    }
  }, [tag, activeCategory]);

  // Initialize chat visibility based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1300;
      setIsMobile(isMobileView);

      // Only update chat visibility on initial load
      if (!sessionStorage.getItem("initialUiStateSet")) {
        dispatch(setChatVisibility(!isMobileView));
        sessionStorage.setItem("initialUiStateSet", "true");
      }
    };

    // Check on initial render
    checkScreenSize();

    // Setup listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup listener
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [dispatch]);

  const toggleChat = () => {
    dispatch(toggleChatVisibility());
  };

  const handleCategoryChange = (category: Category) => {
    // Get available categories with notes
    const availableCategories = tag?.notes
      ? ([...new Set(tag.notes.map((note) => note.category))] as Category[])
      : [];

    // Only change category if it has notes
    if (availableCategories.includes(category)) {
      setActiveCategory(category);

      // Try to find a matching cluster for the selected category
      if (tag?.clusters && tag.clusters.length > 0) {
        const matchingCluster = tag.clusters.find(
          (c) => c.category === category
        );
        if (matchingCluster) {
          setActiveCluster(matchingCluster);
        } else {
          setActiveCluster(null);
        }
      }
    }
  };

  // Loading states
  if (tagLoading) return <LoadingState />;

  // Error states
  if (tagError) return <ErrorState />;

  // Empty state - only return this if there is no tag at all
  if (!tag) return <EmptyState tagId={tagId} tagName={undefined} />;

  // Get unique categories from notes if they exist
  const noteCategories: Category[] =
    tag.notes && tag.notes.length > 0
      ? ([...new Set(tag.notes.map((note) => note.category))] as Category[])
      : [];

  // If there are no notes in any category, show the empty state
  if (!tag.notes || tag.notes.length === 0) {
    return <EmptyState tagId={tagId} tagName={tag.name} />;
  }

  // Get notes for the current category
  const categoryNotes = tag.notes.filter(
    (note) => note.category === activeCategory
  ) as Note[];

  // If no notes in the active category, and no other notes in different categories, show empty state
  if (categoryNotes.length === 0 && noteCategories.length === 0) {
    return <EmptyState tagId={tagId} tagName={tag.name} />;
  }

  // Check if a cluster exists for the current category
  const categoryCluster = tag.clusters?.find(
    (cluster) => cluster.category === activeCategory
  );

  // Check if we need to show the generate button:
  // - No cluster exists for the category, OR
  // - Cluster exists but is marked as dirty (needs refresh)
  const shouldShowGenerateButton =
    (categoryNotes.length > 0 && !categoryCluster) ||
    (categoryCluster && categoryCluster.dirty === true);

  return (
    <div className="flex flex-col md:flex-row min-h-0 h-full relative">
      <div
        className={`w-full ${
          isChatVisible ? "md:w-3/5" : "md:w-full"
        } overflow-y-auto py-6 px-4 md:py-8 md:px-6 transition-all duration-300`}
      >
        {/* Header component */}
        <TagHeader
          tagName={tag.name}
          activeCluster={activeCluster}
          clusters={tag.clusters || []}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          noteCount={categoryNotes.length}
          noteCategories={noteCategories}
        />

        {/* Cluster summary and/or Generate Cluster button */}
        {activeCluster && (
          <>
            <ClusterSummary cluster={activeCluster} />

            {/* Show generate button if cluster is dirty */}
            {activeCluster.dirty && (
              <div className="mt-4 mb-2">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
                  <p className="text-amber-800 text-sm">
                    This cluster needs to be updated with new content.
                  </p>
                </div>
                <GenerateClusterButton
                  tagId={tagId}
                  category={activeCategory}
                  isRefresh={true}
                />
              </div>
            )}

            <hr className="my-6 border-t border-gray-200" />
          </>
        )}

        {/* Show generate button if no cluster exists */}
        {!activeCluster && shouldShowGenerateButton && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Cluster Analysis</h2>
              <p className="text-gray-600 mb-3">
                Generate a cluster to get AI-powered insights for your{" "}
                {activeCategory} notes.
              </p>
              <GenerateClusterButton tagId={tagId} category={activeCategory} />
            </div>
            <hr className="my-6 border-t border-gray-200" />
          </>
        )}

        <h2 className="text-xl font-semibold mb-4">Related Notes</h2>

        {/* Related notes component */}
        <RelatedNotes
          notes={categoryNotes}
          isLoading={tagLoading}
          error={tagError}
        />
      </div>

      {/* Chat toggle buttons */}
      <ChatButtons isChatVisible={isChatVisible} onToggle={toggleChat} />

      {/* Chat panel */}
      <div
        className={`relative transition-all duration-300 ease-in-out ${
          isChatVisible
            ? "w-full md:w-2/5 border-t md:border-t-0 md:border-l border-gray-200 h-[500px] md:h-full flex flex-col"
            : "w-0 md:w-0 h-[500px] md:h-full overflow-hidden"
        }`}
      >
        <ChatPanel
          isVisible={isChatVisible}
          chatId={tag.id.toString()}
          onToggle={toggleChat}
        />
      </div>
    </div>
  );
}
