import { Database } from "@/types/database.types";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import * as z from "zod";

type Note = Database["public"]["Tables"]["cosmic_memory"]["Row"];

export async function generateNoteSummary(notes: Note[]) {
  const result = await generateObject({
    model: openai("gpt-4o"),
    temperature: 0.2,
    system:
      "You are a helpful assistant that specializes in turning disorganized notes into well-organized, markdown formatted notes.",
    prompt: `Create a well-organized, markdown formatted note containing all the information from these related notes. Include citations to the original notes using their IDs and the date of the note. Format citations as [id]. It should appear as a brand new note.
             
             Notes:
             ${notes
               .map(
                 (n) => `ID ${n.id} (${n.created_at}):
             ${n.content}`
               )
               .join("\n\n")}`,
    schema: z.object({
      summary: z
        .string()
        .describe(
          "A comprehensive, well-organized summary that combines the key information from all notes"
        ),
    }),
  });

  return result.object.summary;
}

export async function generateNoteTitle(content: string) {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0,
    system:
      "You are a helpful assistant that specializes in turning disorganized notes into well-organized, markdown formatted notes.",
    prompt: `Come up with a concise title for the following note:
             ${content}`,
    schema: z.object({
      title: z.string().describe("A concise title for the note"),
    }),
  });

  return result.object.title;
}

export async function generateNoteCategory(content: string) {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0.2,
    system:
      "You are an assistant that helps categorize notes into a few broad categories.",
    prompt: `Determine the most likely category for the following note:

    # Note
    ${content}
             
    # Categories
    - To-Do: The note contains a list of things to do.
    - Scratchpad: The note contains random thoughts or ideas.
    - Collections: The note contains a list of related ideas or thoughts.
    - Brainstorm: The note contains ideas for features or products.
    - Journal: The note contains personal journal entries.
    - Meeting: The note contains notes from a meeting.
    - Research: The note contains research notes.
    - Learning: The note contains notes from a class or course.
    - Feedback: The note contains feedback for a product or service.
             
    Choose the most likely category for the note`,
    schema: z.object({
      category: z.string().describe("The category"),
    }),
  });

  return result.object.category;
}

export async function generateNoteFields(content: string) {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0.2,
    system:
      "You are a helpful assistant that specializes in organizing and categorizing notes.",
    prompt: `Generate a concise title and determine the most appropriate category and zone for the following note:

    # Note
    ${content}
             
    # Categories
    - To-Do: The note contains a list of things to do.
    - Scratchpad: The note contains random thoughts or ideas.
    - Collections: The note contains a list of related ideas or thoughts.
    - Brainstorm: The note contains ideas for features or products.
    - Journal: The note contains personal journal entries.
    - Meeting: The note contains notes from a meeting.
    - Research: The note contains research notes.
    - Learning: The note contains notes from a class or course.
    - Feedback: The note contains feedback for a product or service.
    
    # Zones
    - personal: The note is related to personal life, hobbies, or non-work activities.
    - work: The note is related to professional work, job tasks, or career.
    - other: The note doesn't clearly fit into personal or work categories.`,
    schema: z.object({
      title: z.string().describe("A concise title for the note"),
      category: z
        .string()
        .describe("The most appropriate category for the note"),
      zone: z
        .string()
        .describe(
          "The most appropriate zone for the note (personal, work, or other)"
        ),
    }),
  });

  return {
    title: result.object.title,
    category: result.object.category,
    zone: result.object.zone,
  };
}
