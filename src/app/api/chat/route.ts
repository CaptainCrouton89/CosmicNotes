import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import { addNoteTool, searchNotesTool } from "./noteTools";

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
      temperature: 0.2,
      system:
        "You are an insightful, intelligent, assistant managing a user's notes, like a personal librarian.",
      messages,
      tools: {
        addNoteTool,
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
