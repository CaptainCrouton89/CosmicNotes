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
  model: openai("gpt-5"),
  prompt: `Here is an unstructured collection of things to do. It might not be organized or make much sense. Please organize it into a single list of actionable items, and make it more readable.

# To-Do Notes
${content}`,
  itemsArrayDescription: "The list of actionable items",
  system: getSystemPrompt("to-do"),
});

export const getCollectionsPrompt = (content: string): ItemsPrompt => ({
  model: openai("gpt-5-mini"),
  prompt: `${getNoAlterationsPrompt("collection")}

Note Content:
${content}`,
  itemsArrayDescription: "The list of items",
  system: getSystemPrompt("collection"),
});

export const getFeedbackPrompt = (content: string): ItemsPrompt => ({
  model: openai("gpt-5"),
  prompt: `Here is a bunch of unstructured feedback. Please organize it and make it more readable. If there are multiple ideas, please list them out. Treat each idea as a separate item.

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
    case "feedback":
      return getFeedbackPrompt;
    default:
      throw new Error(`Unknown category: ${category}`);
  }
};
