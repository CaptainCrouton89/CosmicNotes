import { ApplicationError } from "@/lib/errors";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import * as z from "zod";

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
      tag: tag,
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
export async function getTagsForNote(
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
        temperature: 0,
        system:
          "You are a helpful assistant that extracts relevant tags from content.",
        prompt: `Identify 1-2 tags that best describe the content. 
                 
                 Content: ${cleanedContent}`,
        schema: z.object({
          tags: z.array(
            z.object({
              tag: z.string().describe("The tag in PascalCase"),
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
        tag: tag.tag,
        confidence: hashTagSet.has(tag.tag) ? 1.0 : tag.confidence,
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

    return uniqueTags;
  } catch (error) {
    console.error("Error generating tags:", error);
    throw new ApplicationError("Failed to generate or save tags", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
