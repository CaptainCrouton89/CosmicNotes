import { Database } from "@/types/database.types";

type Note = Database["public"]["Tables"]["cosmic_memory"]["Row"];

const formatNote = (
  note: Note,
  options: { date?: boolean; id?: boolean } = { date: false, id: false }
) =>
  `## Note Title: ${note.title}
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
  formatter: (
    note: Note,
    options: { date?: boolean; id?: boolean }
  ) => string = formatNote,
  options: { date?: boolean; id?: boolean } = { date: false, id: false }
) => notes.map((note) => formatter(note, options)).join("\n");

export type SummaryPrompt = {
  model: string;
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
  model: "gpt-4o-mini",
  prompt: `${getNoAlterationsPrompt("all")}

# All Notes
${formatNotes(notes, formatNote, { date: false, id: false })}`,
  summary:
    "A comprehensive, well-organized summary that combines the key information from all notes",
});

export const getTodoPrompt =
  (existingNote: string): ((notes: Note[]) => SummaryPrompt) =>
  (notes) => ({
    model: "gpt-4o-mini",
    prompt: `Here is the existing todo list:

${existingNote}

Update the todo list based on the following notes:

# All Notes
${formatNotes(notes, formatNote)}

# Instructions
Do not alter the existing todo list, just add new tasks to it if necessary.`,
    summary: "One large todo list in MD format, with each task on a new line.",
  });

export const getScratchpadPrompt = (notes: Note[]): SummaryPrompt => ({
  model: "gpt-4o-mini",
  prompt: `${getNoAlterationsPrompt("scratchpad")}

# Notes
${formatNotes(notes, formatNote)}`,
  summary:
    "A single, organized scratchpad note with all the information from the notes.",
});

export const getCollectionsPrompt = (notes: Note[]): SummaryPrompt => ({
  model: "gpt-4o-mini",
  prompt: `${getNoAlterationsPrompt("collection")}

# Collection Notes
${formatNotes(notes, (note) => formatNote(note, { date: false, id: false }))}`,
  summary:
    "A single, organized list containing all the information from the collection notes.",
});

export const getBrainstormPrompt = (notes: Note[]): SummaryPrompt => ({
  model: "gpt-4o-mini",
  prompt: `${getNoAlterationsPrompt("brainstorm")}

# Brainstorm Notes
${formatNotes(notes, formatNote)}`,
  summary:
    "A single, organized brainstorm note with all the information from the notes.",
});

export const getJournalPrompt = (notes: Note[]): SummaryPrompt => ({
  model: "gpt-4o-mini",
  prompt: `Organize these journal notes into a single, organized, markdown formatted note, ordered by the date of the note. Use the following format:
  
\`\`\`
# Date - Note Title [ID]
Accurate, concise, and complete journal notes, in long form.
\`\`\`

# Journal Notes
${formatNotes(notes, formatNote, { date: true, id: true })}`,
  summary: "Series of journal entries, one per note, in chronological order.",
});

export const getMeetingPrompt = (notes: Note[]): SummaryPrompt => ({
  model: "gpt-4o-mini",
  prompt: `Organize these meeting notes into a single, organized, markdown formatted note, ordered by the date of the note. Use the following format:
  
\`\`\`
# Date - Note Title [ID]
Organized, concise, and complete meeting notes, in long form.
\`\`\`

# Meeting Notes
${formatNotes(notes, formatNote, { date: true, id: true })}`,
  summary: "Series of meeting notes, one per note, in chronological order.",
});

export const getResearchPrompt = (notes: Note[]): SummaryPrompt => ({
  model: "gpt-4o",
  prompt: `${getNoAlterationsPrompt("research")}

# Research Notes
${formatNotes(notes)}`,
  summary:
    "A single, organized research note with all the information from the notes.",
});

export const getLearningPrompt = (notes: Note[]): SummaryPrompt => ({
  model: "gpt-4o-mini",
  prompt: `${getNoAlterationsPrompt("learning")}

# Learning Notes
${formatNotes(notes)}`,
  summary:
    "A single, organized learning note with all the information from the notes.",
});

export const getFeedbackPrompt = (notes: Note[]): SummaryPrompt => ({
  model: "gpt-4o-mini",
  prompt: `Organize these feedback notes into a single, organized, markdown formatted note, ordered by the date of the note. Use the following format:
  
\`\`\`
# Date - Note Title [ID]
Organized, concise, and actionable feedback notes.
\`\`\`


# Feedback Notes
${formatNotes(notes, formatNote, { date: true, id: true })}`,
  summary: "Series of feedback notes, one per note, in chronological order.",
});

export const getPromptFunction = (
  category: string,
  existingNote: string
): ((notes: Note[]) => SummaryPrompt) => {
  switch (category) {
    case "to-do":
      return getTodoPrompt(existingNote);
    case "scratchpad":
      return getScratchpadPrompt;
    case "collections":
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
