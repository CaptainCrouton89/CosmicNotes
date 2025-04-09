"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Home,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { notesApi } from "@/lib/redux/services/notesApi";

// Type for grouping clusters by tag family
type GroupedClusters = {
  [tagFamily: string]: Array<{
    id: number;
    category: string;
    tag_count: number;
    tag_family: string;
    created_at: string;
    updated_at: string;
  }>;
};

export function AppSidebar() {
  const [isClient, setIsClient] = useState(false);

  // Notes query
  const {
    data: notesData,
    error: notesError,
    isLoading: notesLoading,
  } = notesApi.useGetNotesQuery({
    page: 1,
    limit: 40,
  });

  // Clusters query
  const {
    data: clustersData,
    error: clustersError,
    isLoading: clustersLoading,
  } = clustersApi.useGetClustersQuery({
    page: 1,
    limit: 50, // Increased limit to ensure we get all clusters for grouping
  });

  // Gather clusters mutation
  const [gatherClusters, { isLoading: isGathering }] =
    clustersApi.useGatherClustersMutation();

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Format date only on client side
  const formatDate = (dateString: string) => {
    if (!isClient) return "";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Handle refresh clusters
  const handleRefreshClusters = async () => {
    try {
      await gatherClusters().unwrap();
    } catch (error) {
      console.error("Error gathering clusters:", error);
    }
  };

  // Group clusters by tag_family
  const groupClustersByTagFamily = () => {
    if (!clustersData?.clusters) return {};

    return clustersData.clusters.reduce((grouped: GroupedClusters, cluster) => {
      const family = cluster.tag_family;
      if (!grouped[family]) {
        grouped[family] = [];
      }
      grouped[family].push(cluster);
      return grouped;
    }, {});
  };

  const groupedClusters = groupClustersByTagFamily();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="font-medium">Cosmic Notes</div>
      </SidebarHeader>
      <SidebarContent>
        {/* Home navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/search">
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/chat">
                    <MessageCircle className="h-4 w-4" />
                    <span>Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Clusters */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              Clusters
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRefreshClusters}
              disabled={isGathering}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isGathering ? "animate-spin" : ""}`}
              />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {clustersLoading ? (
              // Loading state
              <SidebarMenu>
                {Array.from({ length: 3 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : clustersError ? (
              <div className="px-4 py-2 text-red-500">An error occurred</div>
            ) : Object.keys(groupedClusters).length === 0 ? (
              <div className="px-4 py-2 text-muted-foreground">
                No clusters found
              </div>
            ) : (
              <SidebarMenu>
                {Object.entries(groupedClusters)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([tagFamily, clusters]) => (
                    <SidebarMenuItem key={tagFamily}>
                      <SidebarMenuButton
                        className="w-full text-left font-medium"
                        asChild
                      >
                        <Link
                          href={`/tag-family/${encodeURIComponent(tagFamily)}`}
                        >
                          <span className="flex justify-between items-center w-full">
                            <span>{tagFamily}</span>
                            <span className="text-muted-foreground text-xs">
                              {clusters.length > 1
                                ? `${clusters.length} categories`
                                : clusters[0].tag_count > 1
                                ? `${clusters[0].tag_count} notes`
                                : `${clusters[0].tag_count} note`}
                            </span>
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent notes */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Notes
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {notesLoading ? (
              // Loading state
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : notesError ? (
              <div className="px-4 py-2 text-red-500">An error occurred</div>
            ) : notesData?.notes.length === 0 ? (
              <div className="px-4 py-2 text-muted-foreground">
                No notes found
              </div>
            ) : (
              <SidebarMenu>
                {notesData?.notes.map((note) => (
                  <SidebarMenuItem key={note.id}>
                    <SidebarMenuButton className="w-full text-left" asChild>
                      <Link
                        href={`/note/${note.id}`}
                        className="flex justify-between"
                      >
                        <span>
                          {note.title ||
                            note.cosmic_tags?.[0]?.tag ||
                            "Untitled"}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
