import { Category, Note } from "@/types/types";
import { openai } from "@ai-sdk/openai";
import { LanguageModel } from "ai";
import {
  getBrainstormSystemPrompt,
  getCollectionsSystemPrompt,
  getFeedbackSystemPrompt,
  getJournalSystemPrompt,
  getLearningSystemPrompt,
  getMeetingSystemPrompt,
  getResearchSystemPrompt,
  getScratchpadSystemPrompt,
} from "./summary/index";

const formatNote = (
  note: Note,
  options: { date?: boolean; id?: boolean; title?: boolean } = {
    date: false,
    id: false,
    title: false,
  }
) =>
  `${options.title ? `## Note Title: ${note.title}` : ""}
${options.id ? `ID: [${note.id}] ` : ""}${
    options.date
      ? `Date: ${new Date(note.created_at).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })}`
      : ""
  }
Content: ${note.content}`;

export type SummaryPrompt = {
  model: LanguageModel;
  prompt: string;
  schemaKey: string;
  schemaValue: string;
  system: string;
};

export const getPromptWithGuidelines = (prompt: string, guidelines: string) =>
  `${prompt}

# AdditionalGuidelines
${guidelines}`;

export const getScratchpadPrompt = (notes: Note[]): SummaryPrompt => ({
  system: getScratchpadSystemPrompt(),
  prompt: `Please organize the following scratchpad notes into a coherent document. Preserve all original thoughts while creating a logical structure.\n\n${notes
    .map((note) => formatNote(note, { title: true }))
    .join("\n\n")}`,
  model: openai("gpt-4.1-mini-2025-04-14"),
  schemaKey: "document",
  schemaValue: "The organized scratchpad notes",
});

export const getCollectionsPrompt = (notes: Note[]): SummaryPrompt => ({
  system: getCollectionsSystemPrompt(),
  prompt: `Please organize the following collection notes into a single comprehensive collection with logical groupings.\n\n${notes
    .map((note) => formatNote(note, { title: true }))
    .join("\n\n")}`,
  model: openai("gpt-4.1-mini-2025-04-14"),
  schemaKey: "collection",
  schemaValue: "The organized collection notes",
});

export const getBrainstormPrompt = (notes: Note[]): SummaryPrompt => ({
  system: getBrainstormSystemPrompt(),
  prompt: `Please organize the following brainstorm notes into a coherent ideation document that preserves all original concepts and ideas.\n\n${notes
    .map((note) => formatNote(note, { title: true }))
    .join("\n\n")}`,
  model: openai("gpt-4.1-2025-04-14"),
  schemaKey: "brainstorm",
  schemaValue: "The organized brainstorm notes",
});

export const getJournalPrompt = (notes: Note[]): SummaryPrompt => ({
  system: getJournalSystemPrompt(),
  prompt: `Please organize the following journal entries chronologically while preserving the authentic voice and emotional context of each entry.\n\n${notes
    .map((note) => formatNote(note, { date: true, id: true, title: true }))
    .join("\n\n")}`,
  model: openai("gpt-4.1-mini-2025-04-14"),
  schemaKey: "journal",
  schemaValue: "The organized journal notes",
});

export const getMeetingPrompt = (notes: Note[]): SummaryPrompt => ({
  system: getMeetingSystemPrompt(),
  prompt: `Please organize the following meeting notes into a comprehensive professional document with clear sections for decisions and action items.\n\n${notes
    .map((note) => formatNote(note, { date: true, id: true, title: true }))
    .join("\n\n")}`,
  model: openai("gpt-4.1-mini-2025-04-14"),
  schemaKey: "meetings",
  schemaValue: "The organized meeting notes",
});

export const getResearchPrompt = (notes: Note[]): SummaryPrompt => ({
  system: getResearchSystemPrompt(),
  prompt: `Please organize the following research notes into a comprehensive academic document that maintains all factual content and citations.\n\n${notes
    .map((note) => formatNote(note, { title: true }))
    .join("\n\n")}`,
  model: openai("gpt-4.1-2025-04-14"),
  schemaKey: "research",
  schemaValue: "The organized research notes",
});

export const getLearningPrompt = (notes: Note[]): SummaryPrompt => ({
  system: getLearningSystemPrompt(),
  prompt: `Please organize the following learning notes into a comprehensive study guide with a logical progression from fundamental to advanced concepts.\n\n${notes
    .map((note) => formatNote(note, { title: true }))
    .join("\n\n")}`,
  model: openai("gpt-4.1-2025-04-14"),
  schemaKey: "learning",
  schemaValue: "The organized learning notes",
});

export const getFeedbackPrompt = (notes: Note[]): SummaryPrompt => ({
  system: getFeedbackSystemPrompt(),
  prompt: `Please organize the following feedback notes into a structured report that preserves the original sentiment and priority of each point.\n\n${notes
    .map((note) => formatNote(note, { date: true, id: true, title: true }))
    .join("\n\n")}`,
  model: openai("gpt-4.1-mini-2025-04-14"),
  schemaKey: "feedback",
  schemaValue: "The organized feedback notes",
});

export const getPromptFunction = (
  category: Category
): ((notes: Note[]) => SummaryPrompt) => {
  switch (category) {
    case "scratchpad":
      return getScratchpadPrompt;
    case "collection":
      return getCollectionsPrompt;
    case "brainstorm":
      return getBrainstormPrompt;
    case "journal":
      return getJournalPrompt;
    case "meeting":
      return getMeetingPrompt;
    case "research":
      return getResearchPrompt;
    case "learning":
      return getLearningPrompt;
    case "feedback":
      return getFeedbackPrompt;
    default:
      throw new Error(`Unknown category: ${category}`);
  }
};
