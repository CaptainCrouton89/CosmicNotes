"use client";

import {
  BookOpen,
  Clock,
  Home,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Plus,
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
import { useMemo } from "react";
import { ExpandableSection } from "./expandable-section";
import { NotesList } from "./notes-list";

export function AppSidebar() {
  // Notes query
  const {
    data: notesData,
    error: notesError,
    isLoading: notesLoading,
  } = notesApi.useGetNotesQuery({
    page: 1,
    limit: 100,
  });

  // Tag Families query
  const {
    data: tagsData,
    error: tagsError,
    isLoading: tagsLoading,
  } = tagsApi.useGetAllTagsQuery();

  // Filter notes by time periods and category
  const { lastDayNotes, lastWeekNotes, collectionNotes, journalNotes } =
    useMemo(() => {
      if (!notesData?.content) {
        return {
          lastDayNotes: [],
          lastWeekNotes: [],
          collectionNotes: [],
          journalNotes: [],
        };
      }

      const now = new Date();
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(now.getDate() - 1);

      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);

      const lastDayNotes = notesData.content.filter((note) => {
        const noteDate = new Date(note.updated_at);
        return noteDate >= oneDayAgo;
      });

      const lastWeekNotes = notesData.content.filter((note) => {
        const noteDate = new Date(note.updated_at);
        return noteDate >= oneWeekAgo && noteDate < oneDayAgo;
      });

      const collectionNotes = notesData.content.filter((note) => {
        return note.category === "collection";
      });

      const journalNotes = notesData.content.filter((note) => {
        return note.category === "journal";
      });

      return {
        lastDayNotes,
        lastWeekNotes,
        collectionNotes,
        journalNotes,
      };
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
            loading={notesLoading}
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
            loading={notesLoading}
            error={notesError}
            titleFallback="Untitled Entry"
          />
        </ExpandableSection>

        {/* Tags */}
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
              Tags
            </span>
            {/* <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRefreshClusters}
              disabled={isGathering}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isGathering ? "animate-spin" : ""}`}
              />
            </Button> */}
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
              <SidebarMenu>
                {tagsData
                  ? [...tagsData]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((tag) => (
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
            <NotesList
              notes={lastDayNotes}
              emptyMessage="No notes in the last 24 hours"
              loading={notesLoading}
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
              loading={notesLoading}
              error={notesError}
            />
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
