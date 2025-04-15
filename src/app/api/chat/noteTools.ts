import { initializeServices } from "@/lib/services";
import { searchNotes } from "@/lib/services/search-service";
import { CATEGORIES, ZONES } from "@/types/types";
import FireCrawlApp, { ScrapeResponse } from "@mendable/firecrawl-js";
import { tool } from "ai";
import OpenAI from "openai";
import { z } from "zod";
export const runtime = "edge";

export const basicSearchNotesTool = tool({
  description: "Search the notes for information",
  parameters: z.object({
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results to return after reranking"),
    category: z
      .enum(CATEGORIES)
      .optional()
      .describe("The category of the notes to search"),
    zone: z.enum(ZONES).optional().describe("The zone of the notes to search"),
    tags: z
      .array(z.string())
      .optional()
      .describe("The tags of the notes to search"),
    tagIds: z
      .array(z.number())
      .optional()
      .describe("The tag IDs of the notes to search"),
  }),
  execute: async ({ limit, category, zone, tags, tagIds }) => {
    console.log("basicSearchNotesTool", {
      limit,
      category,
      zone,
      tags,
      tagIds,
    });
    const { noteService } = await initializeServices();
    const notes = await noteService.getNotesWithFilter(
      category,
      zone,
      tags,
      tagIds
    );

    console.log(
      "basicSearchNotesTool",
      notes.map((note) => note.title)
    );

    return JSON.stringify(
      notes
        .map((note) => ({
          title: note.title,
          content: note.content,
          tags: note.tags?.map((tag) => tag.name),
          zone: note.zone,
          category: note.category,
        }))
        .slice(0, limit)
    );
  },
});

/**
 * Do deep search on the notes
 * @param query An optimized query to search the notes for
 * @param threshold The match threshold for the search
 * @param limit Maximum number of results to return after reranking
 * @param category The category of the notes to search
 * @param zone The zone of the notes to search
 * @param tags The tags of the notes to search
 * @param tagIds The tag IDs of the notes to search
 */
export const deepSearchNotesTool = tool({
  description: "Do deep search on the notes",
  parameters: z.object({
    query: z.string().describe("An optimized query to search the notes for"),
    threshold: z
      .number()
      .optional()
      .default(0.8)
      .describe(
        "The match threshold for the search. .8 is a high threshold, .3 is a low threshold."
      ),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results to return after reranking"),
    category: z
      .enum(CATEGORIES)
      .optional()
      .describe("The category of the notes to search"),
    zone: z.enum(ZONES).optional().describe("The zone of the notes to search"),
    tags: z
      .array(z.string())
      .optional()
      .describe("The tags of the notes to search"),
    tagIds: z
      .array(z.number())
      .optional()
      .describe("The tag IDs of the notes to search"),
  }),
  execute: async ({
    query,
    limit = 5,
    category,
    zone,
    tags,
    tagIds,
    threshold,
  }) => {
    console.log("deepSearchNotesTool", {
      query,
      limit,
      threshold,
      category,
      zone,
      tags,
      tagIds,
    });
    const notes = await searchNotes(
      query,
      limit,
      threshold,
      category,
      zone,
      tags,
      tagIds
    );

    console.log("deepSearchNotesTool", {
      notes: notes.map((note) => note.title),
    });

    return JSON.stringify(
      notes.map((note) => ({
        title: note.title,
        content: note.content,
        tags: note.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
        })),
        zone: note.zone,
        category: note.category,
      }))
    );
  },
});

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
    const { noteService } = await initializeServices();

    await noteService.createNote({
      content,
      title,
      zone,
      category,
      tags,
      tagIds,
    });

    return "Note added successfully";
  },
});

export const scrapeWebSiteTool = tool({
  description: "Scrape a website",
  parameters: z.object({
    url: z.string().describe("The URL of the website to scrape"),
  }),
  execute: async ({ url }) => {
    const app = new FireCrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY!,
    });

    const scrapeResult = await app.scrapeUrl(url, {
      formats: ["markdown"],
      removeBase64Images: true,
    });
    if (scrapeResult.error) {
      return `Error scraping website: ${scrapeResult.error}`;
    }

    const result = scrapeResult as ScrapeResponse<any, never>;

    return result.markdown || "No content found";
  },
});

export const askWebEnabledAI = tool({
  description: "Ask a web-enabled AI for information",
  parameters: z.object({
    query: z.string().describe("The query to ask the web-enabled AI for"),
  }),
  execute: async ({ query }) => {
    console.log("askWebEnabledAI", { query });
    const client = new OpenAI();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-search-preview",
      web_search_options: {
        search_context_size: "medium",
        user_location: {
          type: "approximate",
          approximate: {
            country: "US",
            city: "San Francisco",
            region: "California",
          },
        },
      },

      messages: [
        {
          role: "user",
          content: query,
        },
      ],
    });

    return `
    Response: ${completion.choices[0].message.content}
    
    Annotations: ${JSON.stringify(completion.choices[0].message.annotations)}
    `;
  },
});

export const updateNoteTool = tool({
  description: "Update a note in the database",
  parameters: z.object({
    noteId: z.number().describe("The ID of the note to update"),
    content: z.string().describe("The content of the note"),
    title: z.string().describe("The title of the note"),
    tags: z.array(z.string()).describe("The tags of the note"),
    tagIds: z.array(z.number()).describe("The tag IDs of the note"),
    zone: z.enum(ZONES).describe("The zone of the note"),
    category: z.enum(CATEGORIES).describe("The category of the note"),
  }),

  execute: async ({ noteId, content, title, tags, tagIds, zone, category }) => {
    const { noteService } = await initializeServices();
    await noteService.updateNote(noteId, {
      content,
      title,
      tags,
      tagIds,
      zone,
      category,
    });
    return "Note updated successfully";
  },
});
