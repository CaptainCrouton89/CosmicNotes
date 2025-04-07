"use client";

import { clustersApi } from "@/lib/redux/services/clustersApi";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ClusterPage() {
  const params = useParams();
  const clusterId = Number(params.id);

  const {
    data: cluster,
    isLoading: clusterLoading,
    error: clusterError,
  } = clustersApi.useGetClusterQuery(clusterId);

  const {
    data: notesData,
    isLoading: notesLoading,
    error: notesError,
  } = clustersApi.useGetClusterNotesQuery({ clusterId });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP pp");
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (clusterLoading) {
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

  if (clusterError) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading cluster data</p>
        </div>
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Cluster not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mr-2">
            {cluster.tag}
          </span>
          <span className="text-muted-foreground">
            ({cluster.tag_count} notes)
          </span>
        </h1>
        <div className="text-gray-500 mb-4">
          <p>Last updated {formatDate(cluster.updated_at)}</p>
          <p>Created {formatDate(cluster.created_at)}</p>
        </div>
        <div className="markdown">
          <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
            {cluster.summary}
          </Markdown>
        </div>
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
      ) : notesData?.notes.length === 0 ? (
        <p className="text-gray-500">No notes found in this cluster</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notesData?.notes.map((note) => (
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
                  <a
                    href={`/note/${note.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View full note
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
