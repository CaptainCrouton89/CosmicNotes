import { Database } from "@/types/database.types";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import * as z from "zod";

type Note = Database["public"]["Tables"]["cosmic_memory"]["Row"];

export async function generateNoteSummary(notes: Note[]) {
  const result = await generateObject({
    model: openai("gpt-4o"),
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
