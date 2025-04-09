"use client";

import {
  ChevronDown,
  ChevronRight,
  Clock,
  Home,
  Layers,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
import { tagFamilyApi } from "@/lib/redux/services/tagFamilyApi";
import { useMemo } from "react";

export function AppSidebar() {
  // Collection notes section state
  const [isCollectionExpanded, setIsCollectionExpanded] = useState(true);

  // Notes query
  const {
    data: notesData,
    error: notesError,
    isLoading: notesLoading,
  } = notesApi.useGetNotesQuery({
    page: 1,
    limit: 40,
  });

  // Tag Families query
  const {
    data: tagFamiliesData,
    error: tagFamiliesError,
    isLoading: tagFamiliesLoading,
  } = tagFamilyApi.useGetTagFamiliesQuery({
    page: 1,
    limit: 50,
  });

  // Gather clusters mutation
  const [gatherClusters, { isLoading: isGathering }] =
    clustersApi.useGatherClustersMutation();

  // Handle refresh clusters
  const handleRefreshClusters = async () => {
    try {
      await gatherClusters().unwrap();
    } catch (error) {
      console.error("Error gathering clusters:", error);
    }
  };

  // Filter notes by time periods and category
  const { lastDayNotes, lastWeekNotes, collectionNotes } = useMemo(() => {
    if (!notesData?.notes) {
      return { lastDayNotes: [], lastWeekNotes: [], collectionNotes: [] };
    }

    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const lastDayNotes = notesData.notes.filter((note) => {
      const noteDate = new Date(note.created_at || note.updated_at);
      return noteDate >= oneDayAgo;
    });

    const lastWeekNotes = notesData.notes.filter((note) => {
      const noteDate = new Date(note.created_at || note.updated_at);
      return noteDate >= oneWeekAgo && noteDate < oneDayAgo;
    });

    // Filter notes with Collections category
    const collectionNotes = notesData.notes.filter(
      (note) => note.category === "Collections"
    );

    return { lastDayNotes, lastWeekNotes, collectionNotes };
  }, [notesData]);

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

        {/* Collections Section */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="flex items-center gap-2 justify-between cursor-pointer"
            onClick={() => setIsCollectionExpanded(!isCollectionExpanded)}
          >
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>Collections</span>
            </span>
            {isCollectionExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </SidebarGroupLabel>
          {isCollectionExpanded && (
            <SidebarGroupContent>
              {notesLoading ? (
                <SidebarMenu>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              ) : notesError ? (
                <div className="px-4 py-2 text-red-500">An error occurred</div>
              ) : collectionNotes.length === 0 ? (
                <div className="px-4 py-2 text-muted-foreground">
                  No collection notes found
                </div>
              ) : (
                <SidebarMenu>
                  {collectionNotes.map((note) => (
                    <SidebarMenuItem key={note.id}>
                      <SidebarMenuButton className="w-full text-left" asChild>
                        <Link
                          href={`/note/${note.id}`}
                          className="flex justify-between"
                        >
                          <span>
                            {note.title ||
                              note.cosmic_tags?.[0]?.tag ||
                              "Untitled Collection"}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Tag Families */}
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
              Tag Families
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
            {tagFamiliesLoading ? (
              // Loading state
              <SidebarMenu>
                {Array.from({ length: 3 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : tagFamiliesError ? (
              <div className="px-4 py-2 text-red-500">An error occurred</div>
            ) : !tagFamiliesData?.tagFamilies ||
              tagFamiliesData.tagFamilies.length === 0 ? (
              <div className="px-4 py-2 text-muted-foreground">
                No tag families found
              </div>
            ) : (
              <SidebarMenu>
                {tagFamiliesData.tagFamilies
                  ? [...tagFamiliesData.tagFamilies]
                      .sort((a, b) => a.tag.localeCompare(b.tag))
                      .map((tagFamily) => (
                        <SidebarMenuItem key={tagFamily.id}>
                          <SidebarMenuButton
                            className="w-full text-left font-medium"
                            asChild
                          >
                            <Link href={`/tag-family/${tagFamily.id}`}>
                              <span className="flex justify-between items-center w-full">
                                <span>{tagFamily.tag}</span>
                                <span className="text-muted-foreground text-xs">
                                  {tagFamily.clusters &&
                                  tagFamily.clusters.length > 1
                                    ? `${tagFamily.clusters.length} categories`
                                    : tagFamily.tag_count > 1
                                    ? `${tagFamily.tag_count} notes`
                                    : `${tagFamily.tag_count} note`}
                                </span>
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

        {/* Last Day Notes */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last Day
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {notesLoading ? (
              // Loading state
              <SidebarMenu>
                {Array.from({ length: 3 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : notesError ? (
              <div className="px-4 py-2 text-red-500">An error occurred</div>
            ) : lastDayNotes.length === 0 ? (
              <div className="px-4 py-2 text-muted-foreground">
                No notes in the last 24 hours
              </div>
            ) : (
              <SidebarMenu>
                {lastDayNotes.map((note) => (
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

        {/* Last Week Notes */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last Week
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {notesLoading ? (
              // Loading state
              <SidebarMenu>
                {Array.from({ length: 3 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : notesError ? (
              <div className="px-4 py-2 text-red-500">An error occurred</div>
            ) : lastWeekNotes.length === 0 ? (
              <div className="px-4 py-2 text-muted-foreground">
                No notes in the last week
              </div>
            ) : (
              <SidebarMenu>
                {lastWeekNotes.map((note) => (
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
