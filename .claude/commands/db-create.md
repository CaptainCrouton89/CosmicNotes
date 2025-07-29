1. **Check for Recent Changes**: Examine recent git commits (last 10-20 commits) to identify:
   - Changes to `/src/lib/supabase/types.ts` (schema changes)
   - Database migration files
   - Any SQL-related modifications

2. **Determine Update Scope**: Based on git analysis, identify which documentation needs updating:
   - If `types.ts` changed significantly → Full regeneration
   - If specific tables/functions mentioned in commits → Targeted updates
   - If no schema changes detected → Skip regeneration

3. **Execute Documentation Generation**: Follow the process outlined in `@docs/db/GENERATION_INSTRUCTIONS.md`:
   - Use SQL queries to fetch current schema metadata
   - Update only the documentation files that correspond to changed database objects
   - Maintain cross-references and links between related objects

4. **Quality Control**:
   - Keep documentation concise and focused
   - Remove outdated information
   - Ensure all SQL examples are valid
   - Verify TypeScript examples compile

5. **Update Tracking**: Update the main `docs/db/CLAUDE.md` file with:
   - New timestamp
   - Summary of what was updated
   - Current object counts

## Expected Output

- Updated documentation files only for changed database objects
- Preserved existing documentation for unchanged objects
- A summary of what was updated and why
- No unnecessary file creation or bloated documentation

## Performance Notes

- Only regenerate documentation when actual schema changes are detected
- Use targeted updates rather than full regeneration when possible
- Focus on maintaining accuracy over comprehensive coverage
- Delegate work to subtasks to parallelize updating. For example, if several new functions get created or updated, create a subtask for each.
