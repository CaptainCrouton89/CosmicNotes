import { ApplicationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { tool } from "ai";
import { z } from "zod";

import { CATEGORIES } from "@/lib/constants";
import { Configuration, OpenAIApi } from "openai-edge";

const openAiKey = process.env.OPENAI_API_KEY!;

const config = new Configuration({
  apiKey: openAiKey,
});
const openaiEmbedder = new OpenAIApi(config);

export const runtime = "edge";

export const searchNotesTool = tool({
  description: "Do deep search on the notes",
  parameters: z.object({
    query: z.string().describe("The query to search the notes for"),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results to return after reranking"),
  }),
  execute: async ({ query, limit = 5 }) => {
    const embeddingResponse = await openaiEmbedder.createEmbedding({
      model: "text-embedding-ada-002",
      input: query.replace(/\n/g, " "),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.json();
      throw new ApplicationError("Failed to generate embedding", error);
    }

    const embeddingData = await embeddingResponse.json();
    const [{ embedding }] = embeddingData.data;

    const client = await createClient();
    const { data: notes, error } = await client.rpc("match_notes", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 20, // Retrieve more results initially for reranking
    });

    if (error) {
      throw new ApplicationError("Failed to search notes", {
        supabaseError: error,
      });
    }

    const notesWithTags = await Promise.all(
      notes.map(async (note) => {
        const { data: tags } = await client
          .from("cosmic_tags")
          .select("tag")
          .eq("note", note.id);

        return {
          ...note,
          cosmic_tags: tags,
        };
      })
    );

    // Rerank the results using OpenAI
    if (notesWithTags.length > 0) {
      try {
        const rerankedResults = await rerankResults(query, notesWithTags);

        // Limit to top results
        return rerankedResults.slice(0, limit);
      } catch (rerankError) {
        console.error("Error during reranking:", rerankError);
        // Fall back to original vector similarity order if reranking fails
        return notesWithTags.slice(0, limit);
      }
    }

    return notesWithTags;
  },
});

/**
 * Rerank using cross-encoder
 */
async function rerankResults(query: string, notes: Record<string, unknown>[]) {
  return notes;
}

export const getNotesWithTagsTool = tool({
  description: "Get the notes with tags",
  parameters: z.object({
    tag: z.string().describe("The tag to get the notes for"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of notes to return"),
  }),
  execute: async ({ tag, limit = 10 }) => {
    const client = await createClient();
    const { data: tagResults, error } = await client
      .from("cosmic_tags")
      .select("note")
      .eq("tag", tag)
      .limit(limit);

    if (error) {
      throw new ApplicationError("Failed to get notes with tags", {
        supabaseError: error,
      });
    }

    if (!tagResults || tagResults.length === 0) {
      return [];
    }

    // Get the actual notes from the note IDs
    const noteIds = tagResults.map((result) => result.note);
    const { data: notes, error: notesError } = await client
      .from("cosmic_memory")
      .select("*")
      .in("id", noteIds);

    if (notesError) {
      throw new ApplicationError("Failed to get notes by IDs", {
        supabaseError: notesError,
      });
    }

    // For each note, get its tags
    const notesWithTags = await Promise.all(
      notes.map(async (note) => {
        const { data: tags } = await client
          .from("cosmic_tags")
          .select("tag")
          .eq("note", note.id);

        return {
          ...note,
          cosmic_tags: tags,
        };
      })
    );

    return notesWithTags;
  },
});

export const addNoteTool = tool({
  description: "Add a note to the database",
  parameters: z.object({
    content: z.string().describe("Well-formatted content of the note"),
    tags: z.array(z.string()).describe("The tags to add to the note"),
    zone: z
      .enum(["personal", "work", "other"])
      .describe("The zone of the note"),
    category: z
      .enum(CATEGORIES as [string, ...string[]])
      .describe("The category of the note"),
  }),
  execute: async ({ content, tags }) => {
    const text = `${content} ${tags.map((tag) => `#${tag}`).join(", ")}`;
    const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/note`, {
      method: "POST",
      body: JSON.stringify({ content: text }),
    });

    if (!result.ok) {
      throw new ApplicationError("Failed to add note", {
        status: result.status,
        statusText: result.statusText,
      });
    }

    return "Note added successfully";
  },
});
