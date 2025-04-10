import { createClient } from "@/lib/supabase/server";
import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import { addNoteTool, searchNotesTool } from "../../chat/noteTools";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, tagId }: { messages: Message[]; tagId: number } =
      await req.json();

    const supabase = await createClient();

    const { data: notes, error: notesError } = await supabase
      .from("cosmic_memory_tag_map")
      .select("cosmic_memory(content, title, created_at, id)")
      .eq("tag", tagId);

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
          `## Title: ${note.cosmic_memory.title}
ID: [${note.cosmic_memory.id}] 
Created: ${note.cosmic_memory.created_at}

${note.cosmic_memory.content}

---`
      )
      .join("\n");

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: `You are an insightful, intelligent, partner in a conversation. You are discussing a topic with the user. Here are their notes for this particular topic: 
      
      ## User Notes
      ${notesContent}

      # Metadata
      Current tag: ${tagId}
      
      ## Instructions
      Help the user in any way they wish. If you use notes to answer the question, cite them like this:
      Blah blah blah [123]. It will be converted to a link by the markdown renderer.

      Keep the included notes in mind when answering the question.
      `,
      messages,
      temperature: 0.8,
      topP: 0.95,
      tools: {
        searchNotesTool,
        // getNotesWithTagsTool,
        addNoteTool,
        // addTodoTool,
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
