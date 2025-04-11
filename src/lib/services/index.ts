import { createClient } from "@/lib/supabase/server";
import { ItemService } from "./item-service";
import { NoteService } from "./note-service";
import { TagService } from "./tag-service";
/**
 * Initialize services with proper dependencies
 * Breaks circular dependency by creating services first and then linking them
 */
export async function initializeServices() {
  const supabaseClient = await createClient();

  // Create services without their dependencies first
  const noteService = new NoteService(supabaseClient);
  const tagService = new TagService(supabaseClient);
  const itemService = new ItemService(supabaseClient);

  // Now set the dependencies
  noteService.setTagService(tagService);
  tagService.setNoteService(noteService);

  return {
    noteService,
    tagService,
    itemService,
  };
}

// Export services for direct imports
export { NoteService, TagService };
