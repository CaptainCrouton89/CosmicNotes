"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Home,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Search,
  Settings,
  Tag,
} from "lucide-react";
import Link from "next/link";

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
import { notesApi } from "@/lib/redux/services/notesApi";
import { tagsApi } from "@/lib/redux/services/tagsApi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExpandableSection } from "./expandable-section";
import { NotesList } from "./notes-list";

const NOTES_LIMIT = 30; // Define a limit for notes per page

export function AppSidebar() {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreNotes, setHasMoreNotes] = useState(true);

  // Notes query - now manages its own page
  const {
    data: notesData,
    error: notesError,
    isLoading: notesLoadingInitial,
    isFetching: notesFetchingMore,
  } = notesApi.useGetNotesQuery(
    {
      page: currentPage,
      limit: NOTES_LIMIT,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  // Update hasMoreNotes based on query response
  useEffect(() => {
    if (notesData?.pagination) {
      setHasMoreNotes(notesData.pagination.hasMore);
    }
  }, [notesData]);

  // Tag Families query
  const {
    data: tagsData,
    error: tagsError,
    isLoading: tagsLoading,
  } = tagsApi.useGetAllTagsQuery();

  // State for showing all tags
  const [showAllTags, setShowAllTags] = useState(false);

  // Filter tags by date
  const { recentTags, olderTags } = useMemo(() => {
    if (!tagsData) {
      return { recentTags: [], olderTags: [] };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const recentTagsData = tagsData.filter((tag) => {
      const tagDate = new Date(tag.updated_at);
      return tagDate >= oneWeekAgo;
    });

    const olderTagsData = tagsData.filter((tag) => {
      const tagDate = new Date(tag.updated_at);
      return tagDate < oneWeekAgo;
    });

    return { recentTags: recentTagsData, olderTags: olderTagsData };
  }, [tagsData]);

  // Consolidate all fetched notes. notesData.content will now accumulate due to the merge strategy.
  const allNotes = useMemo(() => notesData?.content || [], [notesData]);

  // Filter notes by time periods and category using allNotes
  const {
    lastDayNotes,
    lastWeekNotes,
    olderNotes,
    collectionNotes,
    journalNotes,
  } = useMemo(() => {
    if (!allNotes.length) {
      return {
        lastDayNotes: [],
        lastWeekNotes: [],
        olderNotes: [],
        collectionNotes: [],
        journalNotes: [],
      };
    }

    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const lastDayNotes = allNotes.filter((note) => {
      const noteDate = new Date(note.updated_at);
      return noteDate >= oneDayAgo;
    });

    const lastWeekNotes = allNotes.filter((note) => {
      const noteDate = new Date(note.updated_at);
      return noteDate >= oneWeekAgo && noteDate < oneDayAgo;
    });

    const olderNotes = allNotes.filter((note) => {
      const noteDate = new Date(note.updated_at);
      return noteDate < oneWeekAgo;
    });

    const collectionNotes = allNotes.filter((note) => {
      return note.category === "collection";
    });

    const journalNotes = allNotes.filter((note) => {
      return note.category === "journal";
    });

    return {
      lastDayNotes,
      lastWeekNotes,
      olderNotes,
      collectionNotes,
      journalNotes,
    };
  }, [allNotes]);

  // Intersection Observer for infinite scrolling
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (notesFetchingMore || notesLoadingInitial) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreNotes) {
          setCurrentPage((prevPage) => {
            return prevPage + 1;
          });
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [notesFetchingMore, notesLoadingInitial, hasMoreNotes]
  );

  // isLoading for display should consider initial load primarily
  const displayLoading = notesLoadingInitial && currentPage === 1;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="font-medium">Cosmic Notes</div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        {/* Wrapper for scrollable content */}
        <div className="flex-grow overflow-y-auto">
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
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
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
          <ExpandableSection
            title="Collections"
            icon={<Layers className="h-4 w-4" />}
          >
            <NotesList
              notes={collectionNotes}
              emptyMessage="No collection notes found"
              loading={displayLoading}
              error={notesError}
              titleFallback="Untitled Collection"
            />
          </ExpandableSection>

          {/* Journal Section */}
          <ExpandableSection
            title="Journal"
            icon={<BookOpen className="h-4 w-4" />}
          >
            <NotesList
              notes={journalNotes}
              emptyMessage="No journal entries found"
              loading={displayLoading}
              error={notesError}
              titleFallback="Untitled Entry"
            />
          </ExpandableSection>

          {/* Tags */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {tagsLoading ? (
                // Loading state
                <SidebarMenu>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              ) : tagsError ? (
                <div className="px-4 py-2 text-red-500">An error occurred</div>
              ) : !tagsData || tagsData.length === 0 ? (
                <div className="px-4 py-2 text-muted-foreground">
                  No tags found
                </div>
              ) : (
                <>
                  <SidebarMenu>
                    {recentTags.length > 0 ? (
                      recentTags.map((tag) => (
                        <SidebarMenuItem key={tag.id}>
                          <SidebarMenuButton
                            className="w-full text-left font-medium"
                            asChild
                          >
                            <Link href={`/tag/${tag.id}`}>
                              <span className="flex justify-between items-center w-full">
                                <span>{tag.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  {tag.note_count > 1
                                    ? `${tag.note_count} notes`
                                    : `${tag.note_count} note`}
                                </span>
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-muted-foreground">
                        No recent tags
                      </div>
                    )}
                  </SidebarMenu>

                  {olderTags.length > 0 && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full flex justify-between items-center px-3 py-1.5 font-medium text-xs text-muted-foreground"
                        onClick={() => setShowAllTags(!showAllTags)}
                      >
                        <span>
                          {showAllTags ? "Hide" : "Show"} older tags (
                          {olderTags.length})
                        </span>
                        {showAllTags ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>

                      {showAllTags && (
                        <SidebarMenu className="mt-1 pt-1 border-t">
                          {olderTags.map((tag) => (
                            <SidebarMenuItem key={tag.id}>
                              <SidebarMenuButton
                                className="w-full text-left font-medium"
                                asChild
                              >
                                <Link href={`/tag/${tag.id}`}>
                                  <span className="flex justify-between items-center w-full">
                                    <span>{tag.name}</span>
                                    <span className="text-muted-foreground text-xs">
                                      {tag.note_count > 1
                                        ? `${tag.note_count} notes`
                                        : `${tag.note_count} note`}
                                    </span>
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      )}
                    </div>
                  )}
                </>
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
              <NotesList
                notes={lastDayNotes}
                emptyMessage="No notes in the last 24 hours"
                loading={displayLoading}
                error={notesError}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Last Week Notes */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last Week
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <NotesList
                notes={lastWeekNotes}
                emptyMessage="No notes in the last week"
                loading={displayLoading}
                error={notesError}
              />
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Older Notes
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <NotesList
                notes={olderNotes}
                emptyMessage="No older notes"
                loading={displayLoading}
                error={notesError}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Load More Trigger Element and Fetching Indicator */}
          {hasMoreNotes && (
            <div ref={loadMoreRef} className="p-4 text-center">
              {notesFetchingMore && <p>Loading more notes...</p>}
            </div>
          )}
          {!hasMoreNotes && allNotes.length > 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <p>All notes loaded.</p>
            </div>
          )}
        </div>{" "}
        {/* END Wrapper for scrollable content */}
        {/* Settings */}
        <SidebarGroup>
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
