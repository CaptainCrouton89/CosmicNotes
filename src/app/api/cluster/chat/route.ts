import { createClient } from "@/lib/supabase/server";
import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import { getNotesWithTagsTool, searchNotesTool } from "../../chat/noteTools";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, tagName }: { messages: Message[]; tagName: string } =
      await req.json();

    const supabase = await createClient();

    console.log("tagName", tagName);

    const { data: notes, error: notesError } = await supabase
      .from("cosmic_tags")
      .select("cosmic_memory(content, created_at, id)")
      .eq("tag", tagName);

    if (!notes) {
      return Response.json({ error: "Cluster not found" }, { status: 404 });
    }

    if (notesError) {
      return Response.json({ error: notesError }, { status: 500 });
    }

    console.log("notes", notes);

    // join notes together, prefaced by date
    const notesContent = notes
      .map(
        (note) =>
          `ID: ${note.cosmic_memory.id} ${note.cosmic_memory.created_at}: ${note.cosmic_memory.content}`
      )
      .join("\n");

    console.log(notesContent);

    const result = streamText({
      model: openai("gpt-4o"),
      system: `You are a helpful assistant that helps users understand and interact with their notes. You are knowledgeable about the notes and can help users understand them better. Here are the notes: ${notesContent}
      
      If you cite a note, write it like this:
      [523]

      It will be converted to a link by the markdown renderer.
      `,
      messages,
      temperature: 0.1,
      tools: {
        searchNotesTool,
        getNotesWithTagsTool,
      },
    });

    const errorHandler = (error: unknown) => {
      if (error == null) {
        return "unknown error";
      }

      if (typeof error === "string") {
        return error;
      }

      if (error instanceof Error) {
        return error.message;
      }

      return JSON.stringify(error);
    };

    // Return the stream response
    return result.toDataStreamResponse({ getErrorMessage: errorHandler });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return Response.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}
