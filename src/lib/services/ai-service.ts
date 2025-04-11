import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, Category, Note, Zone, ZONES } from "@/types/types";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import * as z from "zod";
import { getItemsPromptFunction } from "../prompts/items.prompt";
import { getPromptFunction } from "../prompts/summary.prompt";
const CATEGORY_DESCRIPTIONS = `- to-do: The note contains a list of things to do.
    - collections: The note contains a list of related ideas or thoughts.
    - brainstorm: The note contains ideas for features or products.
    - journal: The note is a journal entry or personal reflection.
    - meeting: The note contains notes from a meeting.
    - research: The note contains research notes.
    - learning: The note contains notes from a class or course.
    - feedback: The note contains feedback for a product or service.
    - scratchpad: The note contains random thoughts or ideas, or the content doesn't fit into other categories.`;

export async function demoGemeni() {
  const result = await generateObject({
    model: google("gemini-1.5-flash"),
    temperature: 0,
    system:
      "You are a helpful assistant that specializes in turning disorganized notes into well-organized, markdown formatted notes.",
    prompt: "Come up with a concise title for the following note",
    schema: z.object({
      title: z.string().describe("A concise title for the note"),
    }),
  });

  return result.object.title;
}

export async function generateTodos(notes: Note[], tagId: number) {
  const supabase = await createClient();

  const { data: existingTodoItems, error: existingTodoItemsError } =
    await supabase
      .from("cosmic_collection_item")
      .select("item")
      .eq("tag", tagId);

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

export async function generateNoteSummary(notes: Note[], category: Category) {
  const getPrompt = getPromptFunction(category);
  if (category === "to-do") {
    return "";
  }

  const { prompt, model, summary } = getPrompt(notes);

  const result = await generateObject({
    model,
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
    model: google("gemini-1.5-flash"),
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

export async function generateNoteCategory(
  content: string,
  similarNotes: (Note & { tags: { name: string }[] })[]
): Promise<Category> {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0.1,
    system:
      "You are an assistant that helps categorize notes into a few broad categories.",
    prompt: `Determine the most likely category for the following note:

    # Note
    ${content}
             
    # Categories
    ${CATEGORY_DESCRIPTIONS}

    # Other Information
    Similar notes were categorized as follows:
    ${similarNotes
      .map(
        (note) =>
          `${note.title}, tags: [${note.tags
            .map((tag) => tag.name)
            .join(", ")}], category: ${note.category}`
      )
      .join("\n")}
             
    Choose the most likely category for the note`,
    schema: z.object({
      category: z.enum(CATEGORIES).describe("The category"),
    }),
  });

  return result.object.category as Category;
}

export async function generateNoteFields(content: string): Promise<{
  title: string;
  category: Category;
  zone: Zone;
}> {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0.2,
    system:
      "You are a helpful assistant that specializes in organizing and categorizing notes.",
    prompt: `Generate a concise title and determine the most appropriate category and zone for the following note:

    # Note
    ${content}
             
    # Categories
    ${CATEGORY_DESCRIPTIONS}
    
    # Zones
    - personal: The note is related to personal life, hobbies, or non-work activities.
    - work: The note is related to professional work, job tasks, or career.
    - other: The note doesn't clearly fit into personal or work categories.`,
    schema: z.object({
      title: z.string().describe("A concise title for the note"),
      category: z
        .enum(CATEGORIES)
        .describe("The most appropriate category for the note"),
      zone: z
        .enum(ZONES)
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

export async function generateWeeklyReview(notes: Note[]) {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0.3,
    topP: 0.1,
    system:
      "You are a thoughtful assistant that helps users reflect on their notes from the past week. Create a helpful summary that identifies themes, patterns, and insights.",
    prompt: `
# Weekly Notes Review

Below are notes from the past week:

${notes
  .map(
    (note) => `
## ${note.title} (${note.category}, ${note.zone})
${note.content}
`
  )
  .join("\n\n")}

# Instructions
1. Create a comprehensive weekly summary that identifies main themes across the notes
2. Highlight important insights, patterns, or trends
3. Group related topics together
4. Format as a well-structured markdown document with sections and bullet points where appropriate
5. Keep your summary concise but thorough, capturing the most valuable information
`,
    schema: z.object({
      weeklyReview: z
        .string()
        .describe(
          "A weekly summary of the user's notes, formatted in markdown"
        ),
    }),
  });

  return result.object.weeklyReview;
}

export async function convertContentToItems(
  content: string,
  category: Category
): Promise<string[]> {
  const getItemsPrompt = getItemsPromptFunction(category);

  const { system, prompt, model, itemsArrayDescription } = getItemsPrompt(
    content,
    category
  );

  const result = await generateObject({
    model,
    temperature: 0,
    system,
    prompt,
    schema: z.object({
      items: z.array(z.string()).describe(itemsArrayDescription),
    }),
  });

  return result.object.items;
}
