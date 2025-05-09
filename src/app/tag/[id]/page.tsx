"use client";

import { ITEM_CATEGORIES } from "@/lib/constants";
import { useAppDispatch } from "@/lib/redux/hooks";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import {
  setActiveCategory,
  setActiveCluster,
} from "@/lib/redux/slices/clusterSlice";
import { setHeader } from "@/lib/redux/slices/uiSlice";
import { RootState } from "@/lib/redux/store";
import { Category, Note } from "@/types/types";
import { use, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import { useSelector } from "react-redux";
import remarkGfm from "remark-gfm";
import { ChatPanel } from "../../../components/ChatPanel";
import { useChatWindow } from "../../../hooks/useChatWindow";
import {
  ChatButtons,
  ClusterSummaryItems,
  EmptyState,
  ErrorState,
  GenerateClusterButton,
  Header,
  LoadingState,
  RelatedNotes,
  TagHeader,
} from "./_components";

export default function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { toggleChat, isChatVisible } = useChatWindow();

  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const categoryParam = resolvedSearchParams.category as string;
  const tagId = parseInt(String(resolvedParams.id), 10);
  const dispatch = useAppDispatch();
  const { activeCategory, activeCluster, clusterMap, validNoteCategories } =
    useSelector((state: RootState) => state.cluster);
  const [generateCluster, { isLoading: isGeneratingCluster }] =
    tagsApi.useGenerateClusterForCategoryMutation();

  // Fetch tag family data
  const {
    data: tag,
    isLoading: tagLoading,
    error: tagError,
  } = tagsApi.useGetTagQuery(tagId, {
    skip: isNaN(tagId),
  });

  useEffect(() => {
    if (tag) {
      dispatch(setHeader(tag.name));
    }
    return () => {
      dispatch(setHeader("Cosmic Notes"));
    };
  }, [tag, dispatch]);

  const categoryNotes = useMemo(
    () =>
      tag?.notes.filter((note) => note.category === activeCategory) as Note[],
    [tag, activeCategory]
  );

  useEffect(() => {
    if (
      categoryParam &&
      validNoteCategories.includes(categoryParam as Category)
    ) {
      dispatch(setActiveCategory(categoryParam as Category));
    } else {
      if (validNoteCategories.length > 0) {
        dispatch(setActiveCategory(validNoteCategories[0]));
      } else {
        // There are no valid categories, so note presumably has note yet loaded
        console.warn("No valid categories found");
      }
    }
  }, [categoryParam, validNoteCategories, dispatch]);

  useEffect(() => {
    console.log("tag", tag, "activeCategory", activeCategory);
    if (tag && activeCategory) {
      if (clusterMap[activeCategory].clusterExists) {
        console.log(
          "clusterMap[activeCategory].clusterExists",
          clusterMap[activeCategory].clusterExists
        );
        // Find a cluster matching the active category if possible
        const matchingCluster = tag.clusters.find(
          (c) => c.category === activeCategory
        );
        dispatch(setActiveCluster(matchingCluster));
      } else {
        // cluster doesn't exist, but should automatically be created since it's a collection-type
        if (clusterMap[activeCategory].isItemCategory) {
          generateCluster({ tagId, category: activeCategory });
        }
      }
    } else {
      dispatch(setActiveCluster(null));
    }
  }, [tag, activeCategory, generateCluster, tagId]);

  // Loading states
  if (tagLoading) return <LoadingState />;

  // Error states
  if (tagError) return <ErrorState />;

  // Empty state - only return this if there is no tag at all
  if (!tag) return <EmptyState tagId={tagId} tagName={undefined} />;

  // If there are no notes in any category, show the empty state
  if (!tag.notes || tag.notes.length === 0) {
    return <EmptyState tagId={tagId} tagName={tag.name} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-0 h-full relative">
      <Header
        tagName={tag.name}
        tagId={tagId}
        noteCount={categoryNotes.length}
        activeCluster={activeCluster}
      />
      <div
        className={`w-full ${
          isChatVisible ? "md:w-3/5 overflow-y-auto" : "md:w-full"
        } pb-64 px-4 md:pb-8 md:px-6 transition-all duration-300 pt-2 md:pt-4`}
      >
        {/* Header component */}
        <TagHeader />

        {/* Cluster summary and/or Generate Cluster button */}
        {activeCluster && activeCluster.category === activeCategory && (
          <>
            <div className="mt-4">
              {isGeneratingCluster ? (
                <div className="p-4 border border-gray-200 rounded-md bg-blue-50">
                  <div className="flex items-center space-x-4">
                    <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-blue-700">
                      Updating {activeCategory} cluster...
                    </p>
                  </div>
                  <p className="text-sm text-blue-600 mt-2 ml-8">
                    This may take a few moments depending on how many notes you
                    have.
                  </p>
                </div>
              ) : ITEM_CATEGORIES.includes(activeCluster.category) ? (
                // Show items from notes using the clusterId
                <ClusterSummaryItems cluster={activeCluster} />
              ) : (
                // Show markdown summary
                <div className="markdown">
                  <Markdown
                    remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                    children={activeCluster.summary}
                  />
                </div>
              )}
            </div>

            {/* Show generate button if cluster is dirty */}
            {activeCluster.dirty &&
              !ITEM_CATEGORIES.includes(activeCluster.category) && (
                <div className="mt-4 mb-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
                    <p className="text-amber-800 text-sm">
                      This cluster needs to be updated with new content.
                    </p>
                  </div>
                  <GenerateClusterButton
                    tagId={tagId}
                    category={activeCluster.category}
                    isRefresh={true}
                  />
                </div>
              )}

            <hr className="my-6 border-t border-gray-200" />
          </>
        )}

        {/* Show generate button if no cluster exists */}
        {(!activeCluster || activeCluster.category !== activeCategory) &&
          !isGeneratingCluster && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Cluster Analysis</h2>
                <p className="text-gray-600 mb-3">
                  Generate a cluster to get AI-powered insights for your{" "}
                  {activeCategory} notes.
                </p>
                {isGeneratingCluster ? (
                  <div className="p-4 border border-gray-200 rounded-md mt-2 bg-blue-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse"></div>
                      <p className="text-blue-700">
                        Generating {activeCategory} cluster...
                      </p>
                    </div>
                    <p className="text-sm text-blue-600 mt-2 ml-8">
                      This may take a few moments depending on how many notes
                      you have.
                    </p>
                  </div>
                ) : (
                  <GenerateClusterButton
                    tagId={tagId}
                    category={activeCategory!}
                  />
                )}
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
          endpoint="/api/cluster/chat"
          isVisible={isChatVisible}
          chatId={tag.id.toString()}
          onToggle={toggleChat}
        />
      </div>
    </div>
  );
}
