import { ApplicationError } from "@/lib/errors";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import * as z from "zod";
import { createClient } from "./supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Tag {
  tag: string;
  confidence: number;
}

/**
 * Generates tags for the given content using AI and saves them to the database
 * @param content The content to generate tags for
 * @param noteId The ID of the note these tags belong to
 * @returns Array of generated tags with confidence scores
 */
export async function generateAndSaveTags(
  content: string,
  noteId: number
): Promise<Tag[]> {
  try {
    // Generate tags using Vercel AI SDK
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      system:
        "You are a helpful assistant that extracts relevant tags from content.",
      prompt: `Extract the most relevant tags from this content. Identify key topics, concepts, and entities. 
               The tags should be concise (1-3 words) and relevant to the content.
               Return exactly 1-7 tags based on the content length and complexity.
               For each tag, provide a confidence score between 0 and 1, where 1 is most confident.
               
               Content: ${content}`,
      schema: z.object({
        tags: z
          .array(
            z.object({
              tag: z.string().describe("Descriptive tag"),
              confidence: z
                .number()
                .min(0)
                .max(1)
                .describe("Confidence score between 0 and 1"),
            })
          )
          .min(1)
          .max(7),
      }),
    });

    const tags = result.object.tags;

    // Process tags: convert to lowercase
    const processedTags = tags.map((tag) => ({
      tag: tag.tag.toLowerCase(),
      confidence: tag.confidence,
    }));

    // Initialize Supabase client
    const supabase = await createClient();

    // Save tags to the database
    const { error } = await supabase.from("cosmic_tags").insert(
      processedTags.map((tag) => ({
        note: noteId,
        tag: tag.tag,
        confidence: tag.confidence,
        created_at: new Date().toISOString(),
      }))
    );

    if (error) {
      throw new ApplicationError("Failed to save tags", {
        supabaseError: error,
      });
    }

    return processedTags;
  } catch (error) {
    console.error("Error generating tags:", error);
    throw new ApplicationError("Failed to generate or save tags", { error });
  }
}
