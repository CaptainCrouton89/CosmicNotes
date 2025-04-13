import { Note } from "@/types/types";
import { openai } from "@ai-sdk/openai";
import { LanguageModel } from "ai";

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

const formatNotes = (
  notes: Note[],
  options: { date?: boolean; id?: boolean; title?: boolean } = {
    date: false,
    id: false,
    title: false,
  }
) => notes.map((note) => formatNote(note, options)).join("\n");

export type SummaryPrompt = {
  model: LanguageModel;
  prompt: string;
  summary: string;
};

export const getPromptWithGuidelines = (prompt: string, guidelines: string) =>
  `${prompt}

# AdditionalGuidelines
${guidelines}`;

const getNoAlterationsPrompt = (category: string) =>
  `Synthesize and reorganize these ${category} notes into a single organized note. Reorganize in a way that is most useful for the user, but do not summarize the content.`;

export const getDefaultPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `${getNoAlterationsPrompt("all")}

# All Notes
${formatNotes(notes)}`,
  summary:
    "A comprehensive, well-organized summary that combines the key information from all notes",
});

export const getScratchpadPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `${getNoAlterationsPrompt("scratchpad")}

# Notes
${formatNotes(notes, { title: true })}`,
  summary:
    "A single, organized scratchpad note with all the information from the notes.",
});

export const getCollectionsPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `${getNoAlterationsPrompt("collection")}

# Collection Notes
${formatNotes(notes, { title: true })}`,
  summary:
    "A single, organized list containing all the information from the collection notes.",
});

export const getBrainstormPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o"),
  prompt: `Synthesize and reorganize these brainstorm notes into a single organized note. Reorganize, restructure, and bucket information. 

# Brainstorm Notes
${formatNotes(notes, { title: true })}`,
  summary:
    "A single, organized brainstorm note with all the information from the notes.",
});

export const getJournalPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `Organize these journal notes into a single, organized, markdown formatted note, ordered by the date of the note. Use the following format:
  
\`\`\`
### [Date] \[id\]
Accurate, concise, and complete journal notes, in long form.
\`\`\`

# Journal Notes
${formatNotes(notes, { date: true, id: true })}`,
  summary: "Series of journal entries, one per note, in chronological order.",
});

export const getMeetingPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `Organize these meeting notes into a single, organized, markdown formatted note, ordered by the date of the note. Use the following format:
  
\`\`\`
## Note Title \[ID\]
Date: [Date]
Organized, concise, and complete meeting notes, in long form.
\`\`\`

# Meeting Notes
${formatNotes(notes, { title: true, date: true, id: true })}`,
  summary: "Series of meeting notes, one per note, in chronological order.",
});

export const getResearchPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o"),
  prompt: `${getNoAlterationsPrompt("research")}

# Research Notes
${formatNotes(notes)}`,
  summary:
    "A single, organized research note with all the information from the notes.",
});

export const getLearningPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `${getNoAlterationsPrompt("learning")}

# Learning Notes
${formatNotes(notes)}`,
  summary:
    "A single, organized learning note with all the information from the notes.",
});

export const getFeedbackPrompt = (notes: Note[]): SummaryPrompt => ({
  model: openai("gpt-4o-mini"),
  prompt: `Organize these feedback notes into a single, organized, markdown formatted note, ordered by the date of the note. Use the following format:
  
\`\`\`
## Note Title \[ID\]
Date: [Date]
Organized, concise, and actionable feedback notes.
\`\`\`


# Feedback Notes
${formatNotes(notes, { date: true, id: true })}`,
  summary: "Series of feedback notes, one per note, in chronological order.",
});

export const getPromptFunction = (
  category: string
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
