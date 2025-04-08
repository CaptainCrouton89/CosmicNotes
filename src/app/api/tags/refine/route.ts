import { ApplicationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { capitalize } from "@/lib/utils";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import * as z from "zod";

interface TagCount {
  tag: string;
  count: number;
}

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // First get all tags
    const { data: allTags, error: fetchError } = await supabase
      .from("cosmic_tags")
      .select("tag");

    if (fetchError) {
      throw new ApplicationError("Failed to fetch tags", {
        supabaseError: fetchError,
      });
    }

    if (!allTags || allTags.length === 0) {
      return NextResponse.json({ message: "No tags to refine" });
    }

    // Count occurrences of each tag
    const tagCounts = allTags.reduce((acc: { [key: string]: number }, curr) => {
      acc[curr.tag] = (acc[curr.tag] || 0) + 1;
      return acc;
    }, {});

    // Convert to array of TagCount objects
    const tags: TagCount[] = Object.entries(tagCounts).map(([tag, count]) => ({
      tag,
      count,
    }));

    // Use AI to identify similar tags and suggest merges
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      temperature: 0,
      system:
        "You are a helpful assistant that analyzes tags and identifies similar or related ones that should be merged.",
      prompt: `Analyze these tags and identify groups of similar or related tags that should be merged.
               For each group, select the most appropriate tag as the primary tag.
               Only suggest merging tags that are truly similar or represent the same concept.
               Do not merge tags that are merely related but distinct concepts.
               
               Tags with their usage counts:
               ${tags.map((t) => `${t.tag} (${t.count})`).join("\n")}`,
      schema: z.object({
        mergeSuggestions: z.array(
          z.object({
            primaryTag: z.string().describe("The tag to keep"),
            similarTags: z
              .array(z.string())
              .describe("Tags to merge into the primary tag"),
            confidence: z
              .number()
              .min(0)
              .max(1)
              .describe("Confidence in this merge suggestion"),
            reason: z
              .string()
              .describe("Brief explanation of why these tags should be merged"),
          })
        ),
      }),
    });

    // Filter high-confidence merges but don't apply them automatically
    const filteredSuggestions = result.object.mergeSuggestions
      .filter((suggestion) => suggestion.confidence >= 0.7)
      .map((suggestion) => ({
        ...suggestion,
        primaryTag: capitalize(suggestion.primaryTag),
        similarTags: suggestion.similarTags,
      }));

    return NextResponse.json({
      message: "Tag refinement suggestions generated",
      suggestions: filteredSuggestions,
    });
  } catch (error) {
    console.error("Error generating tag refinement suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate tag refinement suggestions" },
      { status: 500 }
    );
  }
}
