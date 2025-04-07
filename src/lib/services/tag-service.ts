import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

export interface TagCount {
  tag: string;
  count: number;
}

export async function getAllTagsWithCounts(supabase: SupabaseClient<Database>) {
  const { data: allTags, error: tagsError } = await supabase
    .from("cosmic_tags")
    .select("tag");

  if (tagsError) {
    throw new Error("Failed to fetch tags: " + tagsError.message);
  }

  // Count occurrences of each tag
  return allTags.reduce((acc: { [key: string]: number }, curr) => {
    acc[curr.tag] = (acc[curr.tag] || 0) + 1;
    return acc;
  }, {});
}

export async function getExistingClusters(supabase: SupabaseClient<Database>) {
  const { data: existingClusters, error: clustersError } = await supabase
    .from("cosmic_cluster")
    .select("tag, tag_count");

  if (clustersError) {
    throw new Error(
      "Failed to fetch existing clusters: " + clustersError.message
    );
  }

  return new Set(existingClusters.map((c) => `${c.tag}-${c.tag_count}`));
}

export async function getNotesForTag(
  supabase: SupabaseClient<Database>,
  tag: string
) {
  // First get the note IDs for this tag
  const { data: tagNotes, error: tagNotesError } = await supabase
    .from("cosmic_tags")
    .select("note")
    .eq("tag", tag);

  if (tagNotesError || !tagNotes) {
    throw new Error(
      `Failed to fetch note IDs for tag ${tag}: ${tagNotesError?.message}`
    );
  }

  const noteIds = tagNotes.map((r) => r.note);

  // Then fetch the actual notes with all required fields
  const { data: notes, error: notesError } = await supabase
    .from("cosmic_memory")
    .select("*")
    .in("id", noteIds);

  if (notesError || !notes) {
    throw new Error(
      `Failed to fetch notes for tag ${tag}: ${notesError?.message}`
    );
  }

  return notes;
}
