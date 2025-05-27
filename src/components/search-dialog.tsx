"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { notesApi } from "@/lib/redux/services/notesApi";
import { clustersApi } from "@/lib/redux/services/clustersApi";
import { Note, Cluster } from "@/types/types";
import { formatDistanceToNow } from "date-fns";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: notesData, isLoading: isNotesLoading } = notesApi.useSearchNotesQuery(
    { query: debouncedQuery },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  );

  const { data: clustersData, isLoading: isClustersLoading } = clustersApi.useGetClustersQuery(
    { page: 1, limit: 100 },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  );

  const isLoading = isNotesLoading || isClustersLoading;

  // Filter clusters based on search query
  const filteredClusters = React.useMemo(() => {
    if (!debouncedQuery || !clustersData?.content) return [];
    return clustersData.content.filter((cluster) =>
      cluster.tag?.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [debouncedQuery, clustersData]);

  const handleSelectNote = React.useCallback(
    (note: Note) => {
      router.push(`/note/${note.id}`);
      onOpenChange(false);
      setSearchQuery("");
    },
    [router, onOpenChange]
  );

  const handleSelectCluster = React.useCallback(
    (cluster: Cluster) => {
      router.push(
        `/tag/${cluster.tag?.id}?category=${encodeURIComponent(cluster.category)}`
      );
      onOpenChange(false);
      setSearchQuery("");
    },
    [router, onOpenChange]
  );

  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 [&>button]:hidden">
        <DialogHeader className="px-4 pt-2 pb-0">
          <DialogTitle className="sr-only">Search Notes</DialogTitle>
        </DialogHeader>
        
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes and tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-11 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              Searching...
            </div>
          )}

          {!isLoading && debouncedQuery && notesData?.notes?.length === 0 && filteredClusters.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {!isLoading && (filteredClusters.length > 0 || (notesData?.notes && notesData.notes.length > 0)) && (
            <div className="p-2">
              {filteredClusters.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tags & Clusters
                  </div>
                  {filteredClusters.map((cluster) => (
                    <button
                      key={`cluster-${cluster.id}`}
                      onClick={() => handleSelectCluster(cluster)}
                      className="w-full p-3 text-left rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:bg-blue-50 group mb-1"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            CLUSTER
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {cluster.category}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {cluster.note_count} notes
                        </span>
                      </div>
                      <div className="font-medium text-sm mb-1">
                        {highlightMatch(cluster.tag?.name || "", debouncedQuery)}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {cluster.summary}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {filteredClusters.length > 0 && notesData?.notes && notesData.notes.length > 0 && (
                <div className="px-3 py-2 mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Notes
                </div>
              )}

              {notesData?.notes && notesData.notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className="w-full p-3 text-left rounded-md hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50 group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {note.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {highlightMatch(note.content || "", debouncedQuery)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!debouncedQuery && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <p>Type to search your notes and tags</p>
              <p className="mt-2 text-xs">
                Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">ESC</kbd> to close
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}