"use client";

import { clustersApi } from "@/lib/redux/services/clustersApi";
import {
  setChatVisibility,
  toggleChatVisibility,
} from "@/lib/redux/slices/uiSlice";
import { RootState } from "@/lib/redux/store";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChatButtons,
  ChatPanel,
  ClusterSummary,
  EmptyState,
  ErrorState,
  LoadingState,
  RelatedNotes,
  TagFamilyHeader,
} from "./_components";

export default function TagFamilyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const tagFamilyId = String(params.id);
  const dispatch = useDispatch();

  // Use global UI state for chat visibility
  const isChatVisible = useSelector(
    (state: RootState) => state.ui.isChatVisible
  );

  // Only keep the setter function for mobile detection
  const [, setIsMobile] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categoryParam
  );
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(
    null
  );

  // Initialize chat visibility based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1300;
      setIsMobile(isMobileView);

      // Only update chat visibility on initial load
      // Use sessionStorage to track if we've already set the initial state
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

  // Fetch clusters for this tag family
  const {
    data: clustersData,
    isLoading: clustersLoading,
    error: clustersError,
  } = clustersApi.useGetClustersByCriteriaQuery({
    tagFamily: tagFamilyId,
  });

  // Find the active cluster based on category selection or default to first one
  useEffect(() => {
    if (clustersData?.clusters && clustersData.clusters.length > 0) {
      // Set initial category if not already set
      if (!activeCategory) {
        setActiveCategory(clustersData.clusters[0].category);
        setSelectedClusterId(clustersData.clusters[0].id);
      } else {
        // Find cluster matching active category
        const matchingCluster = clustersData.clusters.find(
          (c) => c.category === activeCategory
        );
        if (matchingCluster) {
          setSelectedClusterId(matchingCluster.id);
        } else {
          // Fallback to first cluster if category not found
          setActiveCategory(clustersData.clusters[0].category);
          setSelectedClusterId(clustersData.clusters[0].id);
        }
      }
    }
  }, [clustersData, activeCategory]);

  // Fetch notes for the selected cluster
  const {
    data: notesData,
    isLoading: notesLoading,
    error: notesError,
  } = clustersApi.useGetClusterNotesQuery(
    { clusterId: selectedClusterId || 0 },
    { skip: !selectedClusterId }
  );

  // Get active cluster object
  const activeCluster = clustersData?.clusters.find(
    (c) => c.id === selectedClusterId
  );

  const toggleChat = () => {
    dispatch(toggleChatVisibility());
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // Loading, error, and empty states
  if (clustersLoading) return <LoadingState />;
  if (clustersError) return <ErrorState />;
  if (!clustersData || clustersData.clusters.length === 0)
    return <EmptyState />;

  return (
    <div className="flex flex-col md:flex-row min-h-0 h-full relative">
      <div
        className={`w-full ${
          isChatVisible ? "md:w-3/5" : "md:w-full"
        } overflow-y-auto py-6 px-4 md:py-8 md:px-6 transition-all duration-300`}
      >
        {/* Header component */}
        <TagFamilyHeader
          tagFamilyId={tagFamilyId}
          activeCluster={activeCluster}
          clusters={clustersData.clusters}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Cluster summary */}
        <ClusterSummary cluster={activeCluster} />

        <hr className="my-6 border-t border-gray-200" />

        <h2 className="text-xl font-semibold mb-4">Related Notes</h2>

        {/* Related notes component */}
        <RelatedNotes
          notes={notesData?.notes}
          isLoading={notesLoading}
          error={notesError}
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
          chatId={tagFamilyId}
          onToggle={toggleChat}
        />
      </div>
    </div>
  );
}
