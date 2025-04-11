import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { LanguageModel } from "ai";
export type ItemsPrompt = {
  model: LanguageModel;
  prompt: string;
  itemsArrayDescription: string;
  system: string;
};

const getSystemPrompt = (category: string) =>
  `You are a helpful assistant that specializes in converting disorganized ${category} notes into a list of items.`;

export const getPromptWithGuidelines = (prompt: string, guidelines: string) =>
  `${prompt}

# AdditionalGuidelines
${guidelines}`;

const getNoAlterationsPrompt = (category: string) =>
  `Convert these ${category} notes into a single organized list. Make it more readable, but do not summarize the content. Do not add any additional information or formatting.`;

export const getToDoPrompt = (content: string): ItemsPrompt => ({
  model: google("gemini-1.5-flash"),
  prompt: `${getNoAlterationsPrompt("to-do")}

# To-Do Notes
${content}`,
  itemsArrayDescription: "The list of actionable items",
  system: getSystemPrompt("to-do"),
});

export const getCollectionsPrompt = (content: string): ItemsPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `${getNoAlterationsPrompt("collection")}

Note Content:
${content}`,
  itemsArrayDescription: "The list of items",
  system: getSystemPrompt("collection"),
});

export const getBrainstormPrompt = (content: string): ItemsPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `${getNoAlterationsPrompt("brainstorm")}

# Brainstormed Ideas
${content}`,
  itemsArrayDescription: "The list of ideas",
  system: getSystemPrompt("brainstorm"),
});

export const getFeedbackPrompt = (content: string): ItemsPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `${getNoAlterationsPrompt("feedback")}

# Feedback Notes
${content}`,
  itemsArrayDescription: "A list of feedback items",
  system: getSystemPrompt("feedback"),
});

export const getItemsPromptFunction = (
  category: string
): ((content: string, category: string) => ItemsPrompt) => {
  switch (category) {
    case "to-do":
      return getToDoPrompt;
    case "collection":
      return getCollectionsPrompt;
    case "brainstorm":
      return getBrainstormPrompt;
    case "feedback":
      return getFeedbackPrompt;
    default:
      throw new Error(`Unknown category: ${category}`);
  }
};
