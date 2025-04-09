"use client";

import { clustersApi } from "@/lib/redux/services/clustersApi";
import { tagFamilyApi } from "@/lib/redux/services/tagFamilyApi";
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
  ClusterSummary,
  EmptyState,
  ErrorState,
  LoadingState,
  RelatedNotes,
  TagFamilyHeader,
} from "./_components";
import { ChatPanel } from "./_components/ChatPanel";
import { TodoListContainer } from "./TodoListContainer";

export default function TagFamilyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const tagFamilyId = parseInt(String(params.id), 10);
  const dispatch = useDispatch();

  // Use global UI state for chat visibility
  const isChatVisible = useSelector(
    (state: RootState) => state.ui.isChatVisible
  );

  // State for mobile detection and active categories
  const [, setIsMobile] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categoryParam
  );
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(
    null
  );
  // Track if we're viewing the To-Do tab specifically
  const [isViewingTodoTab, setIsViewingTodoTab] = useState<boolean>(
    categoryParam === "To-Do"
  );

  // Fetch tag family data
  const {
    data: tagFamily,
    isLoading: tagFamilyLoading,
    error: tagFamilyError,
  } = tagFamilyApi.useGetTagFamilyQuery(tagFamilyId, {
    skip: isNaN(tagFamilyId),
  });

  // Fetch clusters for this tag family
  const {
    data: clustersData,
    isLoading: clustersLoading,
    error: clustersError,
  } = clustersApi.useGetClustersByCriteriaQuery({
    tagFamily: tagFamilyId,
  });

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

  // Find the active cluster based on category selection or default to first one
  useEffect(() => {
    if (clustersData?.clusters && clustersData.clusters.length > 0) {
      // Check if the active category is "To-Do"
      if (activeCategory === "To-Do") {
        setIsViewingTodoTab(true);
        // Try to find a matching cluster
        const todoCluster = clustersData.clusters.find(
          (c) => c.category === "To-Do"
        );
        if (todoCluster) {
          setSelectedClusterId(todoCluster.id);
        } else {
          // If there's no To-Do cluster, just set the first cluster as selected for notes section
          setSelectedClusterId(clustersData.clusters[0].id);
        }
      } else {
        // Handle regular categories
        setIsViewingTodoTab(false);

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
  const activeCluster = clustersData?.clusters?.find(
    (c) => c.id === selectedClusterId
  );

  const toggleChat = () => {
    dispatch(toggleChatVisibility());
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // Loading states
  if (tagFamilyLoading || clustersLoading) return <LoadingState />;

  // Error states
  if (tagFamilyError || clustersError) return <ErrorState />;

  // Empty states
  if (!tagFamily || !clustersData || clustersData.clusters.length === 0)
    return <EmptyState />;

  // Group clusters by category (for the tabs)
  const clustersByCategory = tagFamily.clusters?.reduce((acc, cluster) => {
    if (!acc[cluster.category]) {
      acc[cluster.category] = [];
    }
    acc[cluster.category].push(cluster);
    return acc;
  }, {} as Record<string, typeof tagFamily.clusters>);

  // Get sorted categories with "To-Do" first if it exists
  const categories = clustersByCategory
    ? [...Object.keys(clustersByCategory)].sort((a, b) => {
        if (a === "To-Do") return -1;
        if (b === "To-Do") return 1;
        return a.localeCompare(b);
      })
    : [];

  // Get to-do items from tag family data
  const todoItems = tagFamily.todo_items || [];

  return (
    <div className="flex flex-col md:flex-row min-h-0 h-full relative">
      <div
        className={`w-full ${
          isChatVisible ? "md:w-3/5" : "md:w-full"
        } overflow-y-auto py-6 px-4 md:py-8 md:px-6 transition-all duration-300`}
      >
        {/* Header component with extra hasTodoItems prop */}
        <TagFamilyHeader
          tagName={tagFamily.tag}
          activeCluster={activeCluster}
          clusters={clustersData.clusters}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Display order depends on which tab is active */}
        {isViewingTodoTab ? (
          // When viewing To-Do tab, show todo items first
          <>
            {/* To-Do Items Section - always show when in Todo tab */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">To-Do Items</h2>
              <TodoListContainer
                tagFamilyId={tagFamilyId}
                initialTodos={todoItems}
              />
            </div>

            <hr className="my-6 border-t border-gray-200" />

            {/* Cluster summary */}
            {activeCluster && (
              <>
                <ClusterSummary cluster={activeCluster} />
                <hr className="my-6 border-t border-gray-200" />
              </>
            )}

            <h2 className="text-xl font-semibold mb-4">Related Notes</h2>

            {/* Related notes component */}
            <RelatedNotes
              notes={notesData?.notes}
              isLoading={notesLoading}
              error={notesError}
            />
          </>
        ) : (
          // Normal view for other tabs
          <>
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
          </>
        )}
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
          chatId={tagFamily.tag}
          onToggle={toggleChat}
        />
      </div>
    </div>
  );
}
