import { initializeServices } from "@/lib/services";
import { searchNotes } from "@/lib/services/search-service";
import { CATEGORIES, ZONES } from "@/types/types";
import FireCrawlApp, { ScrapeResponse } from "@mendable/firecrawl-js";
import { tool } from "ai";
import OpenAI from "openai";
import { z } from "zod";
export const runtime = "edge";

export const basicSearchNotesTool = tool({
  description:
    "Query the notes by filtering on category, zone, tags, and/or tagIds",
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
    skip: z
      .number()
      .optional()
      .default(0)
      .describe("Number of results to skip"),
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
    skip = 0,
    category,
    zone,
    tags,
    tagIds,
    threshold,
  }) => {
    console.log("deepSearchNotesTool", {
      query,
      limit: limit + skip,
      threshold,
      category,
      zone,
      tags,
      tagIds,
    });
    const notes = await searchNotes(
      query,
      limit + skip,
      threshold,
      category,
      zone,
      tags,
      tagIds
    );

    const notesToReturn = notes.slice(skip, skip + limit);

    console.log("deepSearchNotesTool", {
      notes: notesToReturn.map((note) => note.title),
    });

    if (notesToReturn.length === 0) {
      return "No notes found — Expand your search by reducing the threshold or using other similar queries.";
    }

    return JSON.stringify(
      notesToReturn.map((note) => ({
        id: note.id,
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
    searchContextSize: z
      .enum(["low", "medium", "high"])
      .describe("The size of the search context"),
  }),
  execute: async ({ query, searchContextSize }) => {
    console.log("askWebEnabledAI", { query });
    const client = new OpenAI();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-search-preview",
      web_search_options: {
        search_context_size: searchContextSize as "low" | "medium" | "high",
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
    content: z.string().optional().describe("The new content of the note"),
    title: z.string().optional().describe("The new title of the note"),
    tags: z
      .array(z.string())
      .optional()
      .describe("The title-cased tags of the note (as alternative to tagIds)"),
    tagIds: z
      .array(z.number())
      .optional()
      .describe("The tag IDs of the note (as alternative to tags)"),
    zone: z.enum(ZONES).optional().describe("The new zone of the note"),
    category: z
      .enum(CATEGORIES)
      .optional()
      .describe("The new category of the note"),
  }),

  execute: async ({ noteId, content, title, tags, tagIds, zone, category }) => {
    const { noteService } = await initializeServices();

    if (!content && !title && !tags && !tagIds && !zone && !category) {
      return "No changes to update";
    }

    const newNote = {
      content,
      title,
      tags,
      tagIds,
      zone,
      category,
    };

    await noteService.updateNote(noteId, newNote);

    return "Note updated successfully";
  },
});


export const addTodoItemsToNoteTool = (noteId: number) =>
  tool({
    description: "Add todo items to a note",
    parameters: z.object({
      items: z.array(z.string()).describe("The items to add to the note"),
    }),
    execute: async ({ items }) => {
      const { itemService } = await initializeServices();
      await itemService.createItems(
        items.map((item) => ({
          item,
          memory: noteId,
          done: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );
      return "Items added to note successfully";
    },
  });

export const addTodoItemsToUnknownNoteTool = tool({
  description: "Add todo items to a note",
  parameters: z.object({
    noteId: z.number().describe("The ID of the note to add items to"),
    items: z.array(z.string()).describe("The items to add to the note"),
  }),
  execute: async ({ items, noteId }) => {
    const { itemService } = await initializeServices();
    await itemService.createItems(
      items.map((item) => ({
        item,
        memory: noteId,
        done: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
    return "Items added to note successfully";
  },
});

export const addItemsToCollectionTool = (collectionId: number) =>
  tool({
    description: "Add todo items to a collection",
    parameters: z.object({
      items: z.array(z.string()).describe("The items to add to the note"),
    }),
    execute: async ({ items }) => {
      const { itemService } = await initializeServices();
      await itemService.createItems(
        items.map((item) => ({
          item,
          memory: collectionId,
          done: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );
      return "Items added to note successfully";
    },
  });

export const addItemsToUnknownCollectionTool = tool({
  description: "Add todo items to a collection",
  parameters: z.object({
    noteId: z.number().describe("The ID of the note to add items to"),
    items: z.array(z.string()).describe("The items to add to the collection"),
  }),
  execute: async ({ items, noteId }) => {
    const { itemService } = await initializeServices();
    await itemService.createItems(
      items.map((item) => ({
        item,
        memory: noteId,
        done: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
    return "Items added to collection successfully";
  },
});

// Diff operation types
const DiffOperationSchema = z.object({
  type: z.enum(["replace", "insert", "delete", "append"]).describe("Type of operation to perform"),
  
  // For replace operations
  find: z.string().optional().describe("Exact text to find and replace"),
  replace: z.string().optional().describe("Text to replace it with"),
  
  // For insert operations
  insertAfter: z.string().optional().describe("Insert content after this exact text"),
  insertBefore: z.string().optional().describe("Insert content before this exact text"),
  content: z.string().optional().describe("Content to insert or append"),
  
  // For delete operations
  delete: z.string().optional().describe("Exact text to delete"),
  
  // Context validation (recommended for safety)
  contextBefore: z.string().optional().describe("Expected text before the target (for validation)"),
  contextAfter: z.string().optional().describe("Expected text after the target (for validation)"),
  
  // Safety options
  allowMultipleMatches: z.boolean().optional().default(false).describe("Allow operation if text appears multiple times"),
});

export const applyDiffToNoteTool = tool({
  description: `Apply a structured diff to a note's content. This allows precise modifications without rewriting the entire note. 
  
  Supports operations:
  - replace: Find exact text and replace it
  - insert: Insert content before/after specific text  
  - delete: Remove exact text
  - append: Add content to the end
  
  Use contextBefore/contextAfter for validation to ensure changes are applied safely.`,
  
  parameters: z.object({
    noteId: z.number().describe("The ID of the note to modify"),
    operations: z.array(DiffOperationSchema).describe("Array of diff operations to apply"),
    dryRun: z.boolean().optional().default(false).describe("If true, validate operations but don't apply changes"),
  }),
  
  execute: async ({ noteId, operations, dryRun = false }) => {
    const { noteService } = await initializeServices();
    
    // Get current note
    const note = await noteService.getNoteById(noteId);
    if (!note) {
      return "Error: Note not found";
    }
    
    let content = note.content;
    const errors: string[] = [];
    const warnings: string[] = [];
    const appliedOperations: string[] = [];
    
    // Validate all operations first (fail fast)
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      
      try {
        switch (op.type) {
          case "replace":
            if (!op.find || op.replace === undefined) {
              errors.push(`Operation ${i + 1}: replace requires 'find' and 'replace' fields`);
              continue;
            }
            
            const replaceMatches = (content.match(new RegExp(escapeRegex(op.find), 'g')) || []).length;
            if (replaceMatches === 0) {
              errors.push(`Operation ${i + 1}: Could not find text "${op.find}" in note content`);
              continue;
            }
            if (replaceMatches > 1 && !op.allowMultipleMatches) {
              errors.push(`Operation ${i + 1}: Text "${op.find}" appears ${replaceMatches} times. Set allowMultipleMatches=true to proceed`);
              continue;
            }
            
            // Validate context if provided
            if (op.contextBefore || op.contextAfter) {
              const findIndex = content.indexOf(op.find);
              if (findIndex === -1) {
                errors.push(`Operation ${i + 1}: Context validation failed - target text not found`);
                continue;
              }
              
              if (op.contextBefore) {
                const beforeStart = Math.max(0, findIndex - op.contextBefore.length);
                const actualBefore = content.substring(beforeStart, findIndex);
                if (!actualBefore.includes(op.contextBefore)) {
                  errors.push(`Operation ${i + 1}: Expected context "${op.contextBefore}" before target, found "${actualBefore}"`);
                  continue;
                }
              }
              
              if (op.contextAfter) {
                const afterStart = findIndex + op.find.length;
                const afterEnd = Math.min(content.length, afterStart + op.contextAfter.length);
                const actualAfter = content.substring(afterStart, afterEnd);
                if (!actualAfter.includes(op.contextAfter)) {
                  errors.push(`Operation ${i + 1}: Expected context "${op.contextAfter}" after target, found "${actualAfter}"`);
                  continue;
                }
              }
            }
            break;
            
          case "insert":
            if (!op.content) {
              errors.push(`Operation ${i + 1}: insert requires 'content' field`);
              continue;
            }
            if (!op.insertAfter && !op.insertBefore) {
              errors.push(`Operation ${i + 1}: insert requires either 'insertAfter' or 'insertBefore' field`);
              continue;
            }
            if (op.insertAfter && op.insertBefore) {
              errors.push(`Operation ${i + 1}: insert cannot have both 'insertAfter' and 'insertBefore'`);
              continue;
            }
            
            const insertTarget = op.insertAfter || op.insertBefore!;
            const insertMatches = (content.match(new RegExp(escapeRegex(insertTarget), 'g')) || []).length;
            if (insertMatches === 0) {
              errors.push(`Operation ${i + 1}: Could not find text "${insertTarget}" for insertion`);
              continue;
            }
            if (insertMatches > 1 && !op.allowMultipleMatches) {
              errors.push(`Operation ${i + 1}: Insert target "${insertTarget}" appears ${insertMatches} times. Set allowMultipleMatches=true to proceed`);
              continue;
            }
            break;
            
          case "delete":
            if (!op.delete) {
              errors.push(`Operation ${i + 1}: delete requires 'delete' field`);
              continue;
            }
            
            const deleteMatches = (content.match(new RegExp(escapeRegex(op.delete), 'g')) || []).length;
            if (deleteMatches === 0) {
              errors.push(`Operation ${i + 1}: Could not find text "${op.delete}" to delete`);
              continue;
            }
            if (deleteMatches > 1 && !op.allowMultipleMatches) {
              errors.push(`Operation ${i + 1}: Delete target "${op.delete}" appears ${deleteMatches} times. Set allowMultipleMatches=true to proceed`);
              continue;
            }
            break;
            
          case "append":
            if (!op.content) {
              errors.push(`Operation ${i + 1}: append requires 'content' field`);
              continue;
            }
            break;
            
          default:
            errors.push(`Operation ${i + 1}: Unknown operation type "${(op as any).type}"`);
        }
      } catch (error) {
        errors.push(`Operation ${i + 1}: Validation error - ${error}`);
      }
    }
    
    // If validation failed, return errors
    if (errors.length > 0) {
      return `Validation failed:\n${errors.join('\n')}`;
    }
    
    // If dry run, return what would be applied
    if (dryRun) {
      return `Dry run successful. ${operations.length} operations would be applied:\n${operations.map((op, i) => `${i + 1}. ${op.type} operation`).join('\n')}`;
    }
    
    // Apply operations sequentially
    let newContent = content;
    
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      
      try {
        switch (op.type) {
          case "replace":
            if (op.allowMultipleMatches) {
              newContent = newContent.replaceAll(op.find!, op.replace!);
              appliedOperations.push(`Replaced all instances of "${op.find}" with "${op.replace}"`);
            } else {
              newContent = newContent.replace(op.find!, op.replace!);
              appliedOperations.push(`Replaced "${op.find}" with "${op.replace}"`);
            }
            break;
            
          case "insert":
            const insertTarget = op.insertAfter || op.insertBefore!;
            const isAfter = !!op.insertAfter;
            
            if (op.allowMultipleMatches) {
              if (isAfter) {
                newContent = newContent.replaceAll(insertTarget, insertTarget + op.content!);
              } else {
                newContent = newContent.replaceAll(insertTarget, op.content! + insertTarget);
              }
              appliedOperations.push(`Inserted content ${isAfter ? 'after' : 'before'} all instances of "${insertTarget}"`);
            } else {
              if (isAfter) {
                newContent = newContent.replace(insertTarget, insertTarget + op.content!);
              } else {
                newContent = newContent.replace(insertTarget, op.content! + insertTarget);
              }
              appliedOperations.push(`Inserted content ${isAfter ? 'after' : 'before'} "${insertTarget}"`);
            }
            break;
            
          case "delete":
            if (op.allowMultipleMatches) {
              newContent = newContent.replaceAll(op.delete!, '');
              appliedOperations.push(`Deleted all instances of "${op.delete}"`);
            } else {
              newContent = newContent.replace(op.delete!, '');
              appliedOperations.push(`Deleted "${op.delete}"`);
            }
            break;
            
          case "append":
            newContent = newContent + op.content!;
            appliedOperations.push(`Appended content to end of note`);
            break;
        }
      } catch (error) {
        errors.push(`Operation ${i + 1}: Failed to apply - ${error}`);
        // If any operation fails, don't apply any changes
        return `Error applying operations:\n${errors.join('\n')}`;
      }
    }
    
    // Apply the changes to the note
    try {
      await noteService.updateNote(noteId, { content: newContent });
      
      let result = `Successfully applied ${operations.length} diff operations:\n${appliedOperations.join('\n')}`;
      
      if (warnings.length > 0) {
        result += `\n\nWarnings:\n${warnings.join('\n')}`;
      }
      
      return result;
      
    } catch (error) {
      return `Error saving note: ${error}`;
    }
  },
});

// Helper function to escape regex special characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
