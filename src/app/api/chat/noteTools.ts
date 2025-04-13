import { generateEmbedding } from "@/lib/embeddings";
import { ApplicationError } from "@/lib/errors";
import { searchNotes } from "@/lib/services/search-service";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/types/types";
import { tool } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";
import { z } from "zod";

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

    const notes = await searchNotes(query, limit, 0.8, null);
    console.log("notes", notes);

    // Rerank the results using OpenAI
    if (notes.length > 0) {
      try {
        const rerankedResults = await rerankResults(query, notes);

        // Limit to top results
        return rerankedResults.slice(0, limit);
      } catch (rerankError) {
        console.error("Error during reranking:", rerankError);
        // Fall back to original vector similarity order if reranking fails
        return notes.slice(0, limit);
      }
    }

    return notes;
  },
});

/**
 * Rerank using cross-encoder
 */
async function rerankResults(query: string, notes: Record<string, unknown>[]) {
  return notes;
}

export const addNoteTool = tool({
  description: "Add a note to the database",
  parameters: z.object({
    content: z.string().describe("Well-formatted content of the note"),
    title: z.string().describe("The title of the note"),
    tags: z
      .array(z.string())
      .optional()
      .describe(
        "Parent tag names to add to the note (as alternative to tagIds)"
      ),
    tagIds: z
      .array(z.number())
      .optional()
      .describe("Tag IDs to add to the note (as alternative to tags)"),
    zone: z
      .enum(["personal", "work", "other"])
      .describe("The zone of the note"),
    category: z.enum(CATEGORIES).describe("The category of the note"),
  }),
  execute: async ({ content, title, tags, tagIds, zone, category }) => {
    const client = await createClient();
    const { error: noteError, data: note } = await client
      .from("cosmic_memory")
      .insert({
        content,
        title,
        embedding: await generateEmbedding(content),
        zone,
        category,
      })
      .select()
      .single();

    if (noteError) {
      throw new ApplicationError("Failed to add note", {
        supabaseError: noteError,
      });
    }

    if (tags || tagIds) {
      let existingTags: { id: number; name: string }[] = [];
      if (tags) {
        const { data: existingTagsFromNames } = await client
          .from("cosmic_tags")
          .select("id, name")
          .in("name", tags);

        if (existingTagsFromNames) {
          existingTags = existingTagsFromNames;
        }
      }
      if (tagIds) {
        const { data: existingTagsFromIds } = await client
          .from("cosmic_tags")
          .select("id, name")
          .in("id", tagIds);

        if (existingTagsFromIds) {
          existingTags = existingTagsFromIds;
        }
      }

      const newTags = tags?.filter(
        (tag) => !existingTags.map((t) => t.name).includes(tag)
      );

      if (newTags) {
        const { error: tagError, data: newTagsData } = await client
          .from("cosmic_tags")
          .insert(
            newTags.map((tag) => ({
              name: tag,
              tag_count: 0,
            }))
          )
          .select("id, name");
        if (tagError) {
          throw new ApplicationError("Failed to add tags", {
            supabaseError: tagError,
          });
        }
        existingTags = existingTags.concat(newTagsData);
      }

      const { error: tagError } = await client
        .from("cosmic_memory_tag_map")
        .insert(
          existingTags.map((tag) => ({
            note: note.id,
            tag: tag.id,
          }))
        );

      if (tagError) {
        throw new ApplicationError("Failed to add tags", {
          supabaseError: tagError,
        });
      }
    }
    if (noteError) {
      throw new ApplicationError("Failed to add note", {
        supabaseError: noteError,
      });
    }

    return "Note added successfully";
  },
});

// export const addTodoTool = tool({
//   description: "Add a todo item for a tag",
//   parameters: z.object({
//     item: z.string().describe("The content of the todo item"),
//     tagFamilyId: z
//       .number()
//       .optional()
//       .describe("The tag family ID to associate the todo item with"),
//     tag: z
//       .string()
//       .optional()
//       .describe("The tag to associate the todo item with"),
//   }),
//   execute: async ({ item, tagFamilyId, tag }) => {
//     try {
//       if (!tagFamilyId && !tag) {
//         throw new ApplicationError(
//           "Either tagFamilyId or tag must be provided"
//         );
//       }

//       // First, find the tag family ID for the given tag
//       const client = await createClient();

//       let tagFamily, tagFamilyError;
//       if (tagFamilyId) {
//         const { data: tagFamilyData, error: tagFamilyErrorData } = await client
//           .from("cosmic_tags")
//           .select("tag_family_id")
//           .eq("id", tagFamilyId)
//           .maybeSingle();

//         tagFamily = tagFamilyData;
//         tagFamilyError = tagFamilyErrorData;
//       } else if (tag) {
//         const { data: tagFamilyData, error: tagFamilyErrorData } = await client
//           .from("cosmic_tags")
//           .select("tag_family_id")
//           .eq("name", tag)
//           .maybeSingle();

//         tagFamily = tagFamilyData;
//         tagFamilyError = tagFamilyErrorData;
//       }

//       if (tagFamilyError) {
//         throw new ApplicationError("Failed to find tag family", {
//           supabaseError: tagFamilyError,
//         });
//       }

//       if (!tagFamily) {
//         throw new ApplicationError("Tag family not found", {
//           identifier: tag || tagFamilyId || "unknown",
//         });
//       }

//       const supabase = await createClient();
//       const { error: todoItemError } = await supabase
//         .from("cosmic_collection_item")
//         .insert({
//           item,
//           tag: tagFamily.id,
//         });

//       if (todoItemError) {
//         throw new ApplicationError("Failed to add todo item", {
//           supabaseError: todoItemError,
//         });
//       }

//       return `Todo item "${item}" added successfully for tag "${tag}"`;
//     } catch (error) {
//       if (error instanceof ApplicationError) {
//         throw error;
//       }
//       throw new ApplicationError("Failed to add todo item", {
//         error: String(error),
//       });
//     }
//   },
// });
