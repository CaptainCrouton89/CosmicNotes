import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import {
  addNoteTool,
  getNotesWithTagsTool,
  searchNotesTool,
} from "./noteTools";

const openAiKey = process.env.OPENAI_API_KEY;

export const runtime = "edge";

export async function POST(req: Request) {
  if (!openAiKey) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY environment variable" },
      { status: 500 }
    );
  }

  try {
    const { messages }: { messages: Message[] } = await req.json();

    // Use streamText for streaming response
    const result = streamText({
      model: openai("gpt-4o"),
      system:
        "You are a helpful assistant that helps users organize and understand their notes. You can discuss various topics and assist with note-taking strategies.",
      messages,
      tools: {
        addNoteTool,
        getNotesWithTagsTool,
        searchNotesTool,
      },
    });

    // Return a streaming response using the correct API
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return Response.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}
