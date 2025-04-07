"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, Home, MessageCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";

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

interface Note {
  id: number;
  content: string;
  created_at: string;
  metadata: Record<string, any>;
}

export function AppSidebar() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're now on the client
    setIsClient(true);

    async function fetchRecentNotes() {
      try {
        setLoading(true);
        const response = await fetch("/api/note?page=1&limit=40");
        if (!response.ok) {
          throw new Error("Failed to fetch notes");
        }
        const data = await response.json();
        setNotes(data.notes || []);
      } catch (err) {
        console.error("Error fetching notes:", err);
        setError("Failed to load recent notes");
      } finally {
        setLoading(false);
      }
    }

    fetchRecentNotes();
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
                  <a href="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/search">
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/chat">
                    <MessageCircle className="h-4 w-4" />
                    <span>Chat</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent notes */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Notes
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {loading ? (
              // Loading state
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : error ? (
              <div className="px-4 py-2 text-red-500">{error}</div>
            ) : notes.length === 0 ? (
              <div className="px-4 py-2 text-muted-foreground">
                No notes found
              </div>
            ) : (
              <SidebarMenu>
                {notes.map((note) => (
                  <SidebarMenuItem key={note.id}>
                    <SidebarMenuButton className="w-full text-left" asChild>
                      <a
                        href={`/note/${note.id}`}
                        className="flex justify-between"
                      >
                        <span>{truncateContent(note.content, 20)}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(note.created_at)}
                        </span>
                      </a>
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
