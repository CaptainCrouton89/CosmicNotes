# Prompt Engineering Guide for Mercury

This document outlines the prompt engineering patterns, strategies, and best practices used in the Mercury codebase for AI-powered note processing.

## 1. Prompt Engineering Patterns by Category

### Category-Specific System Prompts

Each note category has a specialized system prompt that follows a consistent 6-part structure:

1. **Role Definition**: Positions AI as domain expert (e.g., "creative thinking specialist")
2. **Context Setting**: Explains content type being processed
3. **Reasoning Process**: 4-step analysis framework
4. **Instructions**: Explicit rules and constraints
5. **Output Format**: Structured markdown requirements
6. **Example Output**: Concrete demonstration

## 2. Summary Generation Strategies

### Core Principles

- **Preserve, Don't Summarize**: All prompts explicitly forbid condensing content
- **Organize, Don't Interpret**: Structure without adding external context
- **Extract, Don't Infer**: Only use information explicitly stated

### The 4-Step Reasoning Framework

Every system prompt includes:

```
1. Identify key themes and topics
2. Recognize patterns and connections
3. Note important details and metadata
4. Organize for clarity and accessibility
```

### Output Formatting Rules

- Hierarchical markdown structure (##, ###, -)
- Consistent sectioning across categories
- Metadata preservation (dates, IDs, attendees)
- Professional tone for work content, personal for journals

## 3. Category-Specific Prompt Variations

### Scratchpad

- Focus: Random thoughts and quick ideas
- Approach: Light organization, preserve spontaneity
- Sections: Main Thoughts, Quick Ideas, Notes to Expand

### Journal

- Focus: Personal reflections and emotions
- Approach: Chronological organization, emotional context preservation
- Sections: Reflections, Experiences, Thoughts and Feelings

### Research

- Focus: Academic and investigative content
- Approach: Scholarly organization, source preservation
- Sections: Key Findings, Methodology, Data Points, Sources

### Meeting

- Focus: Professional discussions and decisions
- Approach: Chronological flow, action item extraction
- Sections: Overview, Discussion Points, Decisions, Action Items

### Collection

- Focus: Lists of related items
- Approach: Categorical grouping, item preservation
- Sections: Main Collection, Categories, Individual Items

### Learning

- Focus: Educational content and insights
- Approach: Concept hierarchy, example preservation
- Sections: Core Concepts, Key Insights, Examples, Questions

### Feedback

- Focus: Reviews and critiques
- Approach: Balanced analysis, specific point extraction
- Sections: Overall Assessment, Strengths, Improvements, Recommendations

### Brainstorm

- Focus: Creative ideation sessions
- Approach: Idea clustering, connection mapping
- Sections: Core Ideas, Themes, Connections, Next Steps

## 4. Prompt Composition and Templating

### Dynamic Prompt Construction

```typescript
// Note formatting with configurable metadata
formatNote(note, {
  date: true, // Include creation date
  id: true, // Include note ID
  title: true, // Include note title
});
```

### Factory Pattern for Prompt Functions

```typescript
// Returns category-specific prompt generator
getPromptFunction(category: NoteCategory): PromptFunction

// Returns category-specific items extractor
getItemsPromptFunction(category: NoteCategory): ItemsPromptFunction
```

### Schema-Driven Output

All prompts use Zod schemas for structured generation:

```typescript
schema: z.object({
  summary: z.string().describe("Organized note content"),
  items: z.array(itemSchema).describe("Extracted action items"),
  category: z.enum(categories).describe("Note category"),
});
```

## 5. AI Model Integration Patterns

### Anthropic Integration (Chat)

- Primary chat interface using Claude 3.5 Sonnet
- Tool use for note operations (search, read, create)
- Streaming responses with proper error handling

### OpenAI Integration (Processing)

- `generateObject` for structured output
- Model selection based on task complexity

### Error Handling

```typescript
try {
  const result = await generateObject({ ... })
  return result.object
} catch (error) {
  // Fallback to simpler model or default behavior
}
```

## 6. Critical Prompt Engineering Gotchas

### Common Pitfalls to Avoid

1. **Over-Summarization**: Always use "DO NOT summarize" instructions
2. **Information Loss**: Preserve ALL original content, even seemingly minor details
3. **Tone Mismatch**: Match output tone to content type (professional vs personal)
4. **Structure Rigidity**: Allow flexible sectioning based on actual content
5. **Model Hallucination**: Use explicit "DO NOT add information" constraints

### Best Practices

1. **Explicit Negative Instructions**: Tell AI what NOT to do
2. **Concrete Examples**: Include example outputs in system prompts
3. **Role-Based Expertise**: Position AI as specialist for better results
4. **Schema Validation**: Use Zod for guaranteed output structure

### Integration Considerations

1. **Prompt Caching**: System prompts are constants, enabling caching
2. **Token Efficiency**: Balance detail with token usage
3. **Error Recovery**: Graceful fallbacks for failed generations
4. **User Feedback**: Suggested prompts guide user interactions

### Testing Strategies

1. **Category Detection**: Test edge cases between categories
2. **Content Preservation**: Verify no information loss
3. **Format Consistency**: Ensure markdown structure across runs
4. **Model Degradation**: Test fallback behavior with errors
