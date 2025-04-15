import { initializeServices } from "@/lib/services";
import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import {
  addNoteTool,
  basicSearchNotesTool,
  deepSearchNotesTool,
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

  const { settingsService } = await initializeServices();
  const userSettings = await settingsService.getSettings();

  try {
    const { messages }: { messages: Message[] } = await req.json();

    // Use streamText for streaming response
    const result = streamText({
      model: openai("gpt-4.1-2025-04-14"),
      temperature: 0.2,
      system: `You are an insightful, intelligent, assistant managing a user's notes, like a personal librarian.
      
      Additional user information:
      ${userSettings.chat_system_instructions}`,
      messages,
      tools: {
        addNoteTool,
        basicSearchNotesTool,
        deepSearchNotesTool,
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
