import { initializeServices } from "@/lib/services";
import { getModeModel } from "@/lib/utils";
import { Mode } from "@/types/types";
import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import {
  addItemsToUnknownCollectionTool,
  addNoteTool,
  addTodoItemsToUnknownNoteTool,
  applyDiffToNoteTool,
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
      tagId,
      mode,
    }: { messages: Message[]; tagId: number; mode: Mode } = await req.json();

    const { noteService, settingsService } = await initializeServices();
    const notes = await noteService.getCompleteNotesByTag(tagId);
    const userSettings = await settingsService.getSettings();
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
      model: openai(getModeModel(mode)),
      system: `<role>
You are Mercury Cluster Assistant, specialized in analyzing patterns and connections across groups of related notes within a tag cluster.
</role>

<context>
<cluster-notes>
${notesContent}
</cluster-notes>
<tag-id>${tagId}</tag-id>
<user-instructions>
${userSettings.chat_system_instructions}
</user-instructions>
</context>

<capabilities>
- Cross-note pattern analysis and theme identification
- Temporal tracking of idea evolution within the cluster
- Deep search: Semantic search using embeddings to find related notes beyond current cluster
- Basic search: Filter-based search to find notes matching specific criteria
- Note creation: Create synthesis notes or capture insights from cluster analysis
</capabilities>

<instructions>
## Knowledge and Citation
- Keep the included notes for the current tag in mind when answering
- When using information from the user's notes, always cite the source using this format: [note_id]
- Example: "According to your notes on deep learning architecture, transformers are particularly effective for sequential data [123]."
- Only cite notes that actually exist in the user's collection

## Reasoning and Response Style
- Think step-by-step about which notes might be relevant to the user's query
- Be conversational but concise in your responses
- Format your responses using clear, well-structured markdown
- Use headers, bullet points, and other formatting to make information scannable
- When appropriate, suggest connections between different notes that might not be obvious

## When to Search
- If the user asks about a topic not covered in the visible notes, offer to search their entire database
- If the current tag's notes are insufficient to answer fully, suggest performing a search
- When searching, be specific about what you're looking for

## Creative Thinking
- Help the user think more deeply about their notes and ideas
- Ask thoughtful follow-up questions to expand their thinking
- Suggest novel connections or applications of the ideas in their notes
- When appropriate, offer different perspectives or approaches

## Note Creation
- Offer to create new notes when the conversation generates valuable insights
- Structure new notes to align with the user's existing organization system
- Ask if the user wants to save important ideas as notes

Always respond in clear, well-formatted markdown.

<example-interactions>
### Example 1: Answering with notes
User: "What were my main takeaways about spaced repetition?"
Assistant: "From your notes on learning techniques, you identified three key benefits of spaced repetition:

1. Improved long-term retention compared to cramming [45]
2. More efficient use of study time by focusing on difficult items [72]
3. Better transfer of knowledge to real-world applications [98]

Would you like me to search for more detailed notes on implementation strategies?"

## Example 2: Creating a new note
User: "This conversation has been helpful. Can you save the key points?"
Assistant: "I'd be happy to create a new note with the key points from our conversation. Here's what I'll include:

- Main concept: [summary of main topic]
- Key insights: [list of important points discussed]
- Action items: [any next steps identified]

Would you like me to create this note now? Or would you prefer to adjust anything before saving?"
</example-interactions>
</instructions>`,
      messages,
      temperature: 0.8,
      topP: 0.95,
      tools: {
        basicSearchNotesTool,
        deepSearchNotesTool,
        addNoteTool,
        scrapeWebSiteTool,
        askWebEnabledAI,
        updateNoteTool,
        applyDiffToNoteTool,
        addItemsToNote: addTodoItemsToUnknownNoteTool,
        addItemsToCollection: addItemsToUnknownCollectionTool,
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
