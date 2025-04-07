"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Home,
  MessageCircle,
  RefreshCw,
  Search,
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
    limit: 10,
  });

  // Gather clusters mutation
  const [gatherClusters, { isLoading: isGathering }] =
    clustersApi.useGatherClustersMutation();

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper function to truncate content
  const truncateContent = (content: string, maxLength = 15) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

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
            ) : clustersData?.clusters.length === 0 ? (
              <div className="px-4 py-2 text-muted-foreground">
                No clusters found
              </div>
            ) : (
              <SidebarMenu>
                {clustersData?.clusters
                  ? [...clustersData.clusters]
                      .sort(
                        (a, b) =>
                          new Date(b.updated_at).getTime() -
                          new Date(a.updated_at).getTime()
                      )
                      .map((cluster) => (
                        <SidebarMenuItem key={cluster.id}>
                          <SidebarMenuButton
                            className="w-full text-left"
                            asChild
                          >
                            <Link
                              href={`/cluster/${cluster.id}`}
                              className="flex justify-between"
                            >
                              <span>
                                {cluster.tag} ({cluster.tag_count})
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatDate(cluster.updated_at)}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))
                  : null}
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
                        <span>{note.cosmic_tags?.[0]?.tag || "Untagged"}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(note.created_at)}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
