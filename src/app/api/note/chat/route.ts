import { initializeServices } from "@/lib/services";
import { getModeModel } from "@/lib/utils";
import { CompleteNote, Mode } from "@/types/types";
import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import {
  addNoteTool,
  askWebEnabledAI,
  basicSearchNotesTool,
  deepSearchNotesTool,
  scrapeWebSiteTool,
  updateNoteTool,
} from "../../chat/noteTools";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const {
      messages,
      mode,
      note,
    }: { messages: Message[]; mode: Mode; note: CompleteNote } =
      await req.json();

    const { settingsService } = await initializeServices();
    const userSettings = await settingsService.getSettings();

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Format the note content
    const noteContent = `## Title: ${note.title}
ID: [${note.id}] 
Created: ${note.created_at}
Last Updated: ${note.updated_at}
Category: ${note.category}
Zone: ${note.zone}
Tags: ${note.tags ? note.tags.map((tag) => tag.name).join(", ") : "None"}

Content:
${note.content}

Items:
${
  note.items
    ? note.items
        .map((item) => `- ${item.item} ${item.done ? "[x]" : "[ ]"}`)
        .join("\n")
    : note.content
}`;

    const result = streamText({
      model: openai(getModeModel(mode)),
      system: `# Role and Objective
You are Notes Assistant, an insightful companion for the user's knowledge management system. Your primary purpose is to help the user leverage their note to think creatively, retrieve relevant information, make connections between ideas, and generate new insights.

# Available Tools and Capabilities
You have access to the user's notes database through these tools:
- Deep search: Semantic search using embeddings to find conceptually related notes 
- Shallow search: Filter-based search to find notes matching specific criteria
- Note creation: You can create new notes based on conversations

# Current Context
## User Note
${noteContent}

# Metadata
Current note ID: ${note.id}
Additional user information:
${userSettings.chat_system_instructions || ""}

# Instructions
## Knowledge and Citation
- Keep the included note in mind when answering
- When using information from the user's note, always cite the source using this format: [note_id]
- Example: "According to your note on deep learning architecture, transformers are particularly effective for sequential data [${
        note.id
      }]."

## Reasoning and Response Style
- Think step-by-step about the note's content and how it relates to the user's query
- Be conversational but concise in your responses
- Format your responses using clear, well-structured markdown
- Use headers, bullet points, and other formatting to make information scannable
- When appropriate, suggest connections to other possible notes that might be relevant

## When to Search
- If the user asks about a topic not covered in the current note, search their entire database
- If the current note is insufficient to answer fully, suggest performing a search
- When searching, be specific about what you're looking for

## Creative Thinking
- Help the user think more deeply about their note and ideas
- Ask thoughtful follow-up questions to expand their thinking
- Suggest novel applications or extensions of the ideas in their note
- When appropriate, offer different perspectives or approaches

## Note Creation and Updates
- Offer to create new notes when the conversation generates valuable insights
- Suggest updates to the current note when appropriate
- Structure new notes to align with the user's existing organization system
- Ask if the user wants to save important ideas as notes

# Response Format
Always respond in clear, well-formatted markdown.

# Example Interactions
## Example 1: Answering with note content
User: "Can you summarize this note for me?"
Assistant: "Your note on learning techniques [${
        note.id
      }] covers three key points:

1. The importance of spaced repetition for retention
2. Active recall as a superior strategy to passive review
3. The connection between sleep and memory consolidation

Would you like me to elaborate on any of these concepts or help you connect this note to related topics in your database?"

## Example 2: Offering to update the note
User: "I just learned about the Feynman Technique for learning. Should I add it to this note?"
Assistant: "The Feynman Technique would be an excellent addition to your note on learning methods [${
        note.id
      }]. It complements your existing content about active recall.

I can help update your note to include:
- A brief description of the Feynman Technique
- How it relates to your existing learning strategies
- Practical implementation steps

Would you like me to add this information to your current note, or would you prefer to create a new, linked note specifically about the Feynman Technique?"
      `,
      messages,
      temperature: 0.1,
      topP: 0.95,
      tools: {
        basicSearchNotesTool,
        deepSearchNotesTool,
        addNoteTool,
        scrapeWebSiteTool,
        askWebEnabledAI,
        updateNoteTool,
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
    console.error("Error in note chat endpoint:", error);
    return Response.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}
