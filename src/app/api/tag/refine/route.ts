import { initializeServices } from "@/lib/services";
import { capitalize } from "@/lib/utils";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import * as z from "zod";

export async function POST() {
  try {
    // todo: should also do vector similarity for merging
    const { tagService } = await initializeServices();

    const tags = await tagService.getAllTags();
    if (!tags || tags.length === 0) {
      return NextResponse.json({ message: "No tags to refine" });
    }

    const { settingsService } = await initializeServices();
    const userSettings = await settingsService.getSettings();

    // Use AI to identify similar tags and suggest merges
    const result = await generateObject({
      model: openai("gpt-5-mini"),
      system: `You are a helpful assistant that analyzes tags and identifies similar or related ones that should be merged. 
        
        Additional user information:
        ${userSettings.merge_tag_prompt}`,
      temperature: 1,
      prompt: `Analyze these tags and identify groups of similar or related tags that should be merged.
               For each group, select the most appropriate tag as the primary tag.
               Only suggest merging tags that are truly similar or represent the same concept.
               Do not merge tags that are merely related but distinct concepts.
               
               Tags with their usage counts:
               ${tags.map((t) => `${t.name} (${t.note_count})`).join("\n")}`,
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
