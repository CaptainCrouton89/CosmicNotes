import { initializeServices } from "@/lib/services";
import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import {
  addNoteTool,
  basicSearchNotesTool,
  deepSearchNotesTool,
} from "../../chat/noteTools";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, tagId }: { messages: Message[]; tagId: number } =
      await req.json();

    const { noteService } = await initializeServices();
    const notes = await noteService.getCompleteNotesByTag(tagId);

    if (!notes) {
      return Response.json({ error: "Cluster not found" }, { status: 404 });
    }

    // join notes together, prefaced by date
    const notesContent = notes
      .map(
        (note) =>
          `## Title: ${note.title}
ID: [${note.id}] 
Created: ${note.created_at}

${
  note.items
    ? note.items
        .map((item) => `- ${item.item} ${item.done ? "[x]" : "[ ]"}`)
        .join("\n")
    : note.content
}
}

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
        basicSearchNotesTool,
        deepSearchNotesTool,
        addNoteTool,
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
