import { Category } from "@/types/types";

/**
 * Suggested AI prompts for each note category
 * Each category has 1-3 relevant prompts that users can quickly send to the AI
 */
export const categoryPrompts: Record<Category | "default", string[]> = {
  scratchpad: [
    "What do you think?",
    "Create a new, more organized note from this.",
    "What are the key points here?",
  ],
  "to-do": ["What are the next steps?", "Can you prioritize these tasks?"],
  journal: [
    "What do you think?",
    "Give me some reflection questions.",
    "What are the key themes? Search my journal notes—how does this relate?",
  ],
  collection: ["Suggest some more items to add to this collection."],
  brainstorm: [
    "Generate more ideas based on this.",
    "Search the web for more information on this topic.",
    "What am I missing here?",
  ],
  research: [
    "Research more information about this topic.",
    "What am I missing here?",
    "Summarize the findings.",
  ],
  learning: [
    "Expand on these ideas.",
    "Rewrite this in a more organized fashion.",
    "Test my understanding of this.",
  ],
  feedback: [
    "What are the key themes and suggestions?",
    "What are the positive points?",
    "What are the negative points?",
  ],
  meeting: [
    "Summarize key decisions and action items.",
    "What were the main discussion points?",
    "Who is responsible for what next?",
  ],
  default: [
    "What do you think about this note?",
    "Can you summarize this for me?",
    "What are the key takeaways?",
  ],
};

/**
 * Gets the suggested prompts for a given category
 * Falls back to default prompts if the category doesn't exist
 */
export const getSuggestedPrompts = (category?: Category): string[] => {
  if (category && categoryPrompts[category]) {
    return categoryPrompts[category];
  }
  return categoryPrompts.default;
};
