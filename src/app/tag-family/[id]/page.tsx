"use client";

import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { Database } from "@/types/database.types";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Cluster = Database["public"]["Tables"]["cosmic_cluster"]["Row"];

export default function TagFamilyPage() {
  const params = useParams();
  const tagFamilyId = String(params.id);
  const router = useRouter();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(
    null
  );

  // Initialize chat visibility based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1300;
      setIsMobile(isMobileView);
      setIsChatVisible(!isMobileView); // Open on desktop, closed on mobile
    };

    // Check on initial render
    checkScreenSize();

    // Setup listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup listener
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP pp");
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  if (clustersLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2 mb-8"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 animate-pulse rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (clustersError) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading tag family data</p>
        </div>
      </div>
    );
  }

  if (!clustersData || clustersData.clusters.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Tag family not found or no clusters available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-0 h-full relative">
      <div
        className={`w-full ${
          isChatVisible ? "md:w-3/5" : "md:w-full"
        } overflow-y-auto py-6 px-4 md:py-8 md:px-6 transition-all duration-300`}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {tagFamilyId}
            {activeCluster && (
              <span className="text-muted-foreground text-xl ml-2">
                ({activeCluster.tag_count} notes)
              </span>
            )}
          </h1>
          {activeCluster && (
            <div className="text-gray-500 mb-4">
              <p>Last updated {formatDate(activeCluster.updated_at)}</p>
              <p>Created {formatDate(activeCluster.created_at)}</p>
              <p className="mt-1 text-sm font-medium">
                Category: {activeCluster.category}
              </p>
            </div>
          )}

          {/* Category tabs */}
          {clustersData && clustersData.clusters.length > 0 && (
            <Tabs
              defaultValue={activeCategory || clustersData.clusters[0].category}
              value={activeCategory || clustersData.clusters[0].category}
              onValueChange={handleCategoryChange}
              className="mt-4"
            >
              <TabsList className="flex">
                {[...clustersData.clusters]
                  .sort((a, b) => a.category.localeCompare(b.category))
                  .map((cluster: Cluster) => (
                    <TabsTrigger
                      key={cluster.id}
                      value={cluster.category}
                      className={
                        activeCategory === cluster.category
                          ? "font-semibold"
                          : ""
                      }
                    >
                      {cluster.category}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>
          )}

          {activeCluster && (
            <div className="markdown mt-6">
              <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
                {activeCluster.summary}
              </Markdown>
            </div>
          )}
        </div>

        <hr className="my-8 border-t border-gray-200" />

        <h2 className="text-xl font-semibold mb-4">Related Notes</h2>

        {notesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 animate-pulse rounded"
              ></div>
            ))}
          </div>
        ) : notesError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error loading related notes</p>
          </div>
        ) : !notesData || notesData.notes.length === 0 ? (
          <p className="text-gray-500">No notes found in this cluster</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {notesData.notes.map((note) => (
              <div
                key={note.id}
                className="bg-white border rounded-lg overflow-hidden shadow"
              >
                <div className="p-4 border-b">
                  <div className="text-sm text-gray-500">
                    {format(new Date(note.created_at), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="p-4">
                  <p>{truncateContent(note.content)}</p>
                  <div className="mt-4">
                    <Link
                      href={`/note/${note.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View full note
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat toggle button for mobile */}
      <button
        onClick={toggleChat}
        className="md:hidden fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-10"
        aria-label={isChatVisible ? "Hide chat" : "Show chat"}
      >
        {isChatVisible ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Chat expand button for desktop - visible when chat is collapsed */}
      {!isChatVisible && (
        <Button
          variant="outline"
          onClick={toggleChat}
          className="hidden md:flex fixed right-4 top-3 z-10 items-center gap-2 my-auto"
          aria-label="Show chat"
        >
          <ChevronLeft size={16} />
          <span>Open Chat</span>
        </Button>
      )}

      {/* Chat panel with toggle button for desktop */}
      <div
        className={`relative transition-all duration-300 ease-in-out ${
          isChatVisible
            ? "w-full md:w-2/5 border-t md:border-t-0 md:border-l border-gray-200 h-[500px] md:h-full flex flex-col"
            : "w-0 md:w-0 h-[500px] md:h-full overflow-hidden"
        }`}
      >
        {isChatVisible && activeCluster && (
          <>
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold">AI Assistant</h2>
              <Button onClick={toggleChat} aria-label="Hide chat">
                <span className="text-sm">Close</span>
                <ChevronRight size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                endpoint="/api/cluster/chat"
                chatId={tagFamilyId}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
