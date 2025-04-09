"use client";

import { clustersApi } from "@/lib/redux/services/clustersApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClusterRedirectPage() {
  const params = useParams();
  const clusterId = Number(params.id);
  const router = useRouter();

  const {
    data: cluster,
    isLoading: clusterLoading,
    error: clusterError,
  } = clustersApi.useGetClusterQuery(clusterId);

  useEffect(() => {
    // Redirect to the new URL structure when cluster data is loaded
    if (cluster) {
      router.replace(`/tag-family/${encodeURIComponent(cluster.tag_family)}`);
    }
  }, [cluster, router]);

  // Loading state while fetching cluster or redirecting
  return (
    <div className="container mx-auto py-8">
      <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2 mb-8"></div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded"></div>
        ))}
      </div>
    </div>
  );
}
