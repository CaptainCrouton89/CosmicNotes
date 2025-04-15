import { createClient } from "@/lib/supabase/server";
import { ClusterService } from "./cluster-service";
import { ItemService } from "./item-service";
import { NoteService } from "./note-service";
import { SettingsService } from "./settings-service";
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
  const clusterService = new ClusterService(supabaseClient);
  const settingsService = new SettingsService(supabaseClient);

  // Now set the dependencies
  noteService.setTagService(tagService);
  noteService.setClusterService(clusterService);
  noteService.setItemService(itemService);

  tagService.setNoteService(noteService);
  tagService.setClusterService(clusterService);
  tagService.setSettingsService(settingsService);

  return {
    settingsService,
    noteService,
    tagService,
    itemService,
    clusterService,
  };
}

// Export services for direct imports
export { NoteService, SettingsService, TagService };
