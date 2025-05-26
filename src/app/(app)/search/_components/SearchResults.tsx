import { Skeleton } from "@/components/ui/skeleton";
import { Cluster, Note } from "@/types/types";
import React from "react";
import { ClusterCard } from "./ClusterCard";
import { NoteCard } from "./NoteCard";

interface SearchResultsProps {
  searchQuery: string;
  isSearching: boolean;
  isLoading: boolean;
  isClustersLoading: boolean;
  filteredClusters: (Cluster & { type: string })[];
  notes: (Note & { type: string })[] | undefined;
  handleItemClick: (
    item:
      | (Note & { type: string })
      | (Cluster & { type: string })
      | { type: string; id: number }
  ) => void;
  formatDate: (dateString: string) => string;
  createMarkup: (content: string) => { __html: string };
  highlightSearchTerm: (text: string) => string;
  truncateContent: (
    content: string | null | undefined,
    maxLength?: number
  ) => string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchQuery,
  isSearching,
  isLoading,
  isClustersLoading,
  filteredClusters,
  notes,
  handleItemClick,
  formatDate,
  createMarkup,
  highlightSearchTerm,
  truncateContent,
}) => {
  return (
    <div>
      {isClustersLoading && (
        <div className="text-center p-2 sm:p-4">
          <p className="text-gray-500 text-sm">Loading clusters...</p>
        </div>
      )}

      {searchQuery && !isSearching && !isClustersLoading && (
        <div className="mb-3 sm:mb-6 text-gray-500 text-sm">
          Found {filteredClusters.length} clusters and {notes?.length || 0}{" "}
          notes
        </div>
      )}

      {searchQuery && !isClustersLoading && filteredClusters.length > 0 && (
        <div className="mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 border-b pb-1 sm:pb-2">
            Matching Clusters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-8">
            {filteredClusters.map((cluster, index) => (
              <ClusterCard
                key={`cluster-${cluster.id}-${index}`}
                cluster={cluster}
                onClick={() => handleItemClick({ ...cluster, type: "cluster" })}
                formatDate={formatDate}
                highlightedTag={
                  <div
                    dangerouslySetInnerHTML={createMarkup(
                      highlightSearchTerm(cluster.tag?.name || "")
                    )}
                  />
                }
                highlightedSummary={
                  <div
                    dangerouslySetInnerHTML={createMarkup(
                      truncateContent(highlightSearchTerm(cluster.summary))
                    )}
                  />
                }
              />
            ))}
          </div>
        </div>
      )}

      {searchQuery &&
        !isSearching &&
        (!notes || notes.length === 0) &&
        filteredClusters.length === 0 && (
          <div className="text-center p-4 sm:p-8 border rounded-lg bg-gray-50">
            <p className="text-gray-500 font-medium text-sm sm:text-base">
              No results found
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
              Try different search terms or refine your query
            </p>
          </div>
        )}

      {notes && notes.length > 0 && (
        <div className="mb-2 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 border-b pb-1 sm:pb-2">
            Matching Notes
          </h2>
        </div>
      )}

      <div className="space-y-3 sm:space-y-6">
        {notes &&
          notes.map((note, index) => (
            <NoteCard
              key={`note-${note.id}-${index}`}
              note={note}
              onClick={() => handleItemClick({ ...note, type: "note" })}
              formatDate={formatDate}
              highlightedContent={
                <div
                  dangerouslySetInnerHTML={createMarkup(
                    truncateContent(highlightSearchTerm(note.content ?? ""))
                  )}
                />
              }
            />
          ))}

        {isLoading && (
          <div className="space-y-2 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 sm:p-5 border rounded-lg bg-gray-50">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 mb-2 sm:mb-4" />
                <Skeleton className="h-5 sm:h-6 w-3/4 mb-1 sm:mb-2" />
                <Skeleton className="h-3 sm:h-4 w-full mb-1" />
                <Skeleton className="h-3 sm:h-4 w-full mb-1" />
                <Skeleton className="h-3 sm:h-4 w-2/3 mb-2 sm:mb-4" />
                <Skeleton className="h-2 sm:h-3 w-20 sm:w-24" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
