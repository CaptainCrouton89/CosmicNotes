import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import * as z from "zod";
import { getPromptFunction } from "../prompts/summary.prompt";

type Note = Database["public"]["Tables"]["cosmic_memory"]["Row"];

export async function generateTodos(notes: Note[], tagFamilyId: number) {
  const supabase = await createClient();

  const { data: existingTodoItems, error: existingTodoItemsError } =
    await supabase
      .from("cosmic_todo_item")
      .select("item")
      .eq("tag", tagFamilyId);

  if (existingTodoItemsError) {
    throw new Error(existingTodoItemsError.message);
  }

  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0,
    system:
      "You are a helpful assistant that specializes in combining todo items from notes.",
    prompt: `Here are the existing todo items:

${existingTodoItems.map((item) => `${item.item}`).join("\n")}

# Todo Items in Notes

${notes.map((note) => `${note.content}`).join("\n")}

# Instructions

Based on the notes, return a list of todo items that are not already in the existing todo list.`,
    schema: z.object({
      todos: z.array(z.string()).describe("A list of todos"),
    }),
  });

  return result.object.todos;
}

export async function generateNoteSummary(notes: Note[]) {
  const getPrompt = getPromptFunction(notes[0].category);
  if (notes[0].category === "To-Do") {
    return "";
  }

  const { prompt, model, summary } = getPrompt(notes);

  console.log(prompt);

  const result = await generateObject({
    model: openai(model),
    temperature: 0.1,
    topP: 0,
    system:
      "You are a helpful assistant that specializes in turning disorganized notes into well-organized, markdown formatted notes.",
    prompt,
    schema: z.object({
      summary: z.string().describe(summary),
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
