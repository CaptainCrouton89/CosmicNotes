import { Database } from "@/types/database.types";
import { CompleteCluster, CompleteTag } from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";

interface BenchmarkResult {
  name: string;
  duration: number;
  queryCount: number;
}

// Type for our benchmark functions
type BenchmarkFunction = () => Promise<any>;

/**
 * Runs both old and new implementations and compares their performance
 * @param name Name of the benchmark
 * @param oldImplementation Function with the old implementation
 * @param newImplementation Function with the new implementation
 * @param iterations Number of times to run each implementation for average results
 * @returns Comparison of benchmark results
 */
export async function compareBenchmark(
  name: string,
  oldImplementation: BenchmarkFunction,
  newImplementation: BenchmarkFunction,
  iterations: number = 3
): Promise<{
  name: string;
  oldResult: BenchmarkResult;
  newResult: BenchmarkResult;
  improvement: {
    duration: number;
    percentage: number;
    queryCount: number;
    queryPercentage: number;
  };
}> {
  // Run old implementation
  const oldResults = await runBenchmark(
    `${name} (old)`,
    oldImplementation,
    iterations
  );

  // Run new implementation
  const newResults = await runBenchmark(
    `${name} (new)`,
    newImplementation,
    iterations
  );

  // Calculate improvements
  const durationImprovement = oldResults.duration - newResults.duration;
  const durationPercentage = (durationImprovement / oldResults.duration) * 100;

  const queryImprovement = oldResults.queryCount - newResults.queryCount;
  const queryPercentage = (queryImprovement / oldResults.queryCount) * 100;

  return {
    name,
    oldResult: oldResults,
    newResult: newResults,
    improvement: {
      duration: durationImprovement,
      percentage: durationPercentage,
      queryCount: queryImprovement,
      queryPercentage: queryPercentage,
    },
  };
}

/**
 * Runs a benchmark for a function multiple times and returns the average result
 * @param name Name of the benchmark
 * @param func Function to benchmark
 * @param iterations Number of iterations to run for average result
 * @returns Benchmark result
 */
export async function runBenchmark(
  name: string,
  func: BenchmarkFunction,
  iterations: number = 3
): Promise<BenchmarkResult> {
  let totalDuration = 0;
  let totalQueryCount = 0;

  console.log(`Running benchmark: ${name} (${iterations} iterations)`);

  for (let i = 0; i < iterations; i++) {
    const queryCountBefore = await getQueryCount();

    const start = performance.now();
    await func();
    const end = performance.now();

    const queryCountAfter = await getQueryCount();

    const duration = end - start;
    const queryCount = queryCountAfter - queryCountBefore;

    totalDuration += duration;
    totalQueryCount += queryCount;

    console.log(
      `Iteration ${i + 1}: ${duration.toFixed(2)}ms, ${queryCount} queries`
    );
  }

  const avgDuration = totalDuration / iterations;
  const avgQueryCount = totalQueryCount / iterations;

  console.log(
    `Average: ${avgDuration.toFixed(2)}ms, ${avgQueryCount.toFixed(2)} queries`
  );

  return {
    name,
    duration: avgDuration,
    queryCount: avgQueryCount,
  };
}

/**
 * Gets the current query count from Supabase - mock implementation
 * In a real implementation, this would fetch from Supabase logs or metrics
 */
async function getQueryCount(): Promise<number> {
  // This is a mock implementation - in a real scenario, you might
  // fetch this from Supabase logs, metrics, or add a custom counter
  return Promise.resolve(0);
}

/**
 * Example benchmark functions for getTag
 */
export function createTagBenchmarks(
  supabase: SupabaseClient<Database>,
  tagId: number
) {
  // Old implementation (N+1 queries)
  const oldGetTag = async (): Promise<CompleteTag> => {
    const { data: tag, error } = await supabase
      .from("cosmic_tags")
      .select("*, cosmic_cluster(*), cosmic_memory_tag_map(*, note(*))")
      .eq("id", tagId)
      .single();

    if (error) throw error;

    const { data: tagMap, error: tagMapError } = await supabase
      .from("cosmic_memory_tag_map")
      .select("*, note(*)")
      .eq("tag", tag.id);

    if (tagMapError) throw tagMapError;

    // Return only the fields on the Tag object
    return {
      id: tag.id,
      name: tag.name,
      created_at: tag.created_at,
      updated_at: tag.updated_at,
      dirty: tag.dirty,
      note_count: tagMap.length,
      notes: tagMap.map((t) => t.note),
      clusters: tag.cosmic_cluster,
    } as CompleteTag;
  };

  // New implementation (single query)
  const newGetTag = async (): Promise<CompleteTag> => {
    const { data, error } = await supabase.rpc(
      "get_tag_with_relations" as any,
      { tag_id: tagId }
    );

    if (error) throw error;
    return data as CompleteTag;
  };

  return {
    oldGetTag,
    newGetTag,
  };
}

/**
 * Example benchmark functions for getClusterById
 */
export function createClusterBenchmarks(
  supabase: SupabaseClient<Database>,
  clusterId: number
) {
  // Old implementation (N+1 queries)
  const oldGetCluster = async (): Promise<CompleteCluster> => {
    const { data, error } = await supabase
      .from("cosmic_cluster")
      .select("*, cosmic_tags(name, id), cosmic_collection_item(*)")
      .eq("id", clusterId)
      .single();

    if (error) throw error;

    // Get all memories associated with this tag id
    const { data: tagMappings, error: notesError } = await supabase
      .from("cosmic_memory_tag_map")
      .select("note")
      .eq("tag", data.tag);

    if (notesError) throw notesError;

    if (!tagMappings || tagMappings.length === 0) {
      return {
        ...data,
        tag: data.cosmic_tags,
        note_count: 0,
        notes: [],
        cluster_items: data.cosmic_collection_item.map((item) => ({
          ...item,
          cluster: undefined,
          embedding: item.embedding || "[]",
          memory: undefined,
        })),
      } as CompleteCluster;
    }

    // Get all the memory IDs
    const memoryIds = tagMappings.map((mapping) => mapping.note);

    // Fetch the actual memories
    const { data: memories, error: memoriesError } = await supabase
      .from("cosmic_memory")
      .select("*")
      .eq("category", data.category)
      .in("id", memoryIds);

    if (memoriesError) throw memoriesError;

    // Fetch all tags and items for these memories in batch
    const notesWithTagsAndItems = await Promise.all(
      memories.map(async (memory) => {
        // Get tags for this memory
        const { data: tags, error: tagsError } = await supabase
          .from("cosmic_memory_tag_map")
          .select("*, cosmic_tags(*)")
          .eq("note", memory.id);

        if (tagsError) throw tagsError;

        // Get collection items for this memory
        const { data: items, error: itemsError } = await supabase
          .from("cosmic_collection_item")
          .select("*")
          .eq("memory", memory.id);

        if (itemsError) throw itemsError;

        return {
          ...memory,
          tags: tags.map((tag) => tag.cosmic_tags),
          items: items || [],
        };
      })
    );

    return {
      ...data,
      tag: data.cosmic_tags,
      note_count: notesWithTagsAndItems.length,
      notes: notesWithTagsAndItems,
      cluster_items: data.cosmic_collection_item.map((item) => ({
        ...item,
        cluster: undefined,
        embedding: item.embedding || "[]",
        memory: undefined,
      })),
    } as CompleteCluster;
  };

  // New implementation (single query)
  const newGetCluster = async (): Promise<CompleteCluster> => {
    const { data, error } = await supabase.rpc(
      "get_cluster_with_relations" as any,
      { cluster_id: clusterId }
    );

    if (error) throw error;
    return data as CompleteCluster;
  };

  return {
    oldGetCluster,
    newGetCluster,
  };
}

/**
 * Run a comprehensive performance benchmark
 */
export async function runPerformanceBenchmark(
  supabase: SupabaseClient<Database>,
  tagId: number,
  clusterId: number
): Promise<void> {
  try {
    console.log("Starting performance benchmark...");

    // Tag benchmarks
    const { oldGetTag, newGetTag } = createTagBenchmarks(supabase, tagId);
    const tagResults = await compareBenchmark("getTag", oldGetTag, newGetTag);

    console.log("\nTag benchmark results:");
    console.log(
      `Duration improvement: ${tagResults.improvement.duration.toFixed(
        2
      )}ms (${tagResults.improvement.percentage.toFixed(2)}%)`
    );
    console.log(
      `Query count improvement: ${
        tagResults.improvement.queryCount
      } queries (${tagResults.improvement.queryPercentage.toFixed(2)}%)`
    );

    // Cluster benchmarks
    const { oldGetCluster, newGetCluster } = createClusterBenchmarks(
      supabase,
      clusterId
    );
    const clusterResults = await compareBenchmark(
      "getClusterById",
      oldGetCluster,
      newGetCluster
    );

    console.log("\nCluster benchmark results:");
    console.log(
      `Duration improvement: ${clusterResults.improvement.duration.toFixed(
        2
      )}ms (${clusterResults.improvement.percentage.toFixed(2)}%)`
    );
    console.log(
      `Query count improvement: ${
        clusterResults.improvement.queryCount
      } queries (${clusterResults.improvement.queryPercentage.toFixed(2)}%)`
    );

    console.log("\nBenchmark complete!");
  } catch (error) {
    console.error("Error running benchmark:", error);
  }
}
