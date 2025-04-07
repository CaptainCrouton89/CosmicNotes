import { ApplicationError } from "@/lib/errors";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import * as z from "zod";
import { createClient } from "./supabase/server";

interface Tag {
  tag: string;
  confidence: number;
}

/**
 * Extract hashtags from content and return them as tags with confidence 1.0
 * @param content The content to extract hashtags from
 * @returns Array of [tags, cleaned content]
 */
function extractHashtags(content: string): [Tag[], string] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: Tag[] = [];
  const cleanedContent = content.replace(hashtagRegex, (match, tag) => {
    hashtags.push({
      tag: tag.toLowerCase(),
      confidence: 1.0,
    });
    return tag; // Keep the word, just remove the # symbol
  });

  return [hashtags, cleanedContent];
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
    // First extract explicit hashtags
    const [hashTags, cleanedContent] = extractHashtags(content);

    // Create a Set of hashtag values for quick lookup
    const hashTagSet = new Set(hashTags.map((tag) => tag.tag));

    // Generate additional tags using AI if there's remaining content
    let aiTags: Tag[] = [];
    if (cleanedContent.trim()) {
      // Generate tags using Vercel AI SDK
      const result = await generateObject({
        model: openai("gpt-4o"),
        system:
          "You are a helpful assistant that extracts relevant tags from content.",
        prompt: `Extract the most relevant tags from this content. Identify key topics, concepts, and entities. 
                 The tags should be concise (1-3 words) and relevant to the content.
                 Return exactly 1-5 tags based on the content length and complexity.
                 For each tag, provide a confidence score between 0 and 1, where 1 is most confident.
                 
                 Content: ${cleanedContent}`,
        schema: z.object({
          tags: z.array(
            z.object({
              tag: z.string(),
              confidence: z
                .number()
                .min(0)
                .max(1)
                .describe("Confidence score between 0 and 1"),
            })
          ),
        }),
      });

      // Process AI tags and set confidence to 1.0 if they match a hashtag
      aiTags = result.object.tags.map((tag) => ({
        tag: tag.tag.toLowerCase(),
        confidence: hashTagSet.has(tag.tag.toLowerCase())
          ? 1.0
          : tag.confidence,
      }));
    }

    // Combine hashtags and AI-generated tags
    const allTags = [...hashTags, ...aiTags];

    // Remove duplicates, keeping the highest confidence score
    const uniqueTags = allTags.reduce((acc: Tag[], current) => {
      const existingTag = acc.find((tag) => tag.tag === current.tag);
      if (!existingTag) {
        acc.push(current);
      } else if (current.confidence > existingTag.confidence) {
        existingTag.confidence = current.confidence;
      }
      return acc;
    }, []);

    // Initialize Supabase client
    const supabase = await createClient();

    // Save tags to the database
    const { error } = await supabase.from("cosmic_tags").insert(
      uniqueTags.map((tag) => ({
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

    return uniqueTags;
  } catch (error) {
    console.error("Error generating tags:", error);
    throw new ApplicationError("Failed to generate or save tags", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
