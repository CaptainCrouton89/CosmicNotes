import { Category } from "@/types/types";

export interface SuggestedPrompt {
  label: string;
  prompt: string;
}

/**
 * Suggested AI prompts for each note category
 * Each category has 1-3 relevant prompts that users can quickly send to the AI
 */
export const categoryPrompts: Record<Category | "default", SuggestedPrompt[]> =
  {
    scratchpad: [
      {
        label: "Your thoughts?",
        prompt:
          "What are your initial thoughts or feedback on the content of this scratchpad note?",
      },
      {
        label: "Organize this",
        prompt:
          "Can you help me create a new, more organized note based on the content of this scratchpad?",
      },
      {
        label: "Key points",
        prompt:
          "What are the main key points or takeaways from this scratchpad note?",
      },
    ],
    "to-do": [
      {
        label: "Next steps?",
        prompt:
          "Based on this to-do list, what are the immediate next actions I should focus on?",
      },
      {
        label: "Prioritize tasks",
        prompt:
          "Can you help me prioritize the tasks in this list? Perhaps suggest a high, medium, low order.",
      },
    ],
    journal: [
      {
        label: "Your thoughts?",
        prompt:
          "What are your general thoughts or interpretations of this journal entry?",
      },
      {
        label: "Reflection questions",
        prompt:
          "Provide some insightful reflection questions based on this journal entry to help me explore my thoughts and feelings further.",
      },
      {
        label: "Key themes & connections",
        prompt:
          "What are the key themes in this journal entry? Search my other journal notes—how does this entry relate to or connect with previous ones?",
      },
    ],
    collection: [
      {
        label: "Suggest additions",
        prompt:
          "Based on the items currently in this collection, can you suggest some more relevant items to add?",
      },
    ],
    brainstorm: [
      {
        label: "Generate more ideas",
        prompt:
          "Generate more ideas building upon what's already in this brainstorm session.",
      },
      {
        label: "Web research",
        prompt:
          "Please search the web for more information, articles, or resources related to the topic of this brainstorm.",
      },
      {
        label: "What's missing?",
        prompt:
          "Review these brainstorming ideas. What perspectives or crucial elements might I be missing?",
      },
    ],
    research: [
      {
        label: "Research more",
        prompt:
          "Please conduct further research and gather more detailed information about the main topic of this note.",
      },
      {
        label: "What's missing?",
        prompt:
          "Based on this research, what important aspects or information might be missing or underdeveloped?",
      },
      {
        label: "Summarize findings",
        prompt:
          "Can you provide a concise summary of the key research findings presented in this note?",
      },
    ],
    learning: [
      {
        label: "Expand on ideas",
        prompt:
          "Can you expand on the core ideas presented in this learning note, providing more detail or examples?",
      },
      {
        label: "Reorganize this",
        prompt:
          "Please rewrite the content of this learning note in a more structured and organized fashion to improve clarity.",
      },
      {
        label: "Test my understanding",
        prompt:
          "Generate some questions to test my understanding of the material covered in this learning note.",
      },
    ],
    feedback: [
      {
        label: "Key themes/suggestions",
        prompt:
          "What are the main recurring themes and actionable suggestions from this feedback?",
      },
      {
        label: "Positive points",
        prompt:
          "What are the main positive points highlighted in this feedback?",
      },
      {
        label: "Negative points",
        prompt:
          "What are the main negative points or areas for improvement mentioned in this feedback?",
      },
    ],
    meeting: [
      {
        label: "Summarize decisions & actions",
        prompt:
          "Please summarize the key decisions made and action items assigned during this meeting.",
      },
      {
        label: "Main discussion points",
        prompt:
          "What were the main topics and points of discussion in this meeting?",
      },
      {
        label: "Who does what?",
        prompt:
          "Clarify who is responsible for which action items or next steps following this meeting.",
      },
    ],
    default: [
      {
        label: "Your thoughts?",
        prompt: "What are your general thoughts or feedback on this note?",
      },
      {
        label: "Summarize this",
        prompt:
          "Can you provide a concise summary of the content of this note?",
      },
      {
        label: "Key takeaways",
        prompt:
          "What are the most important key takeaways or action items from this note?",
      },
    ],
  };

/**
 * Gets the suggested prompts for a given category
 * Falls back to default prompts if the category doesn't exist
 */
export const getSuggestedPrompts = (category?: Category): SuggestedPrompt[] => {
  if (category && categoryPrompts[category]) {
    return categoryPrompts[category];
  }
  return categoryPrompts.default;
};
