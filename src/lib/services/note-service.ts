import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/database.types";
import { Category, Note, Tag, Zone } from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { ITEM_CATEGORIES } from "../constants";
import { generateEmbedding } from "../embeddings";
import { generateNoteCategory, generateNoteFields } from "./ai-service";
import { ItemService } from "./item-service";
import { searchNotes } from "./search-service";
import { TagService } from "./tag-service";
export type NoteRow = Tables<"cosmic_memory">;
export type NoteInsert = TablesInsert<"cosmic_memory">;
export type NoteUpdate = TablesUpdate<"cosmic_memory">;

export type NoteWithTagsAndItems = Note & {
  tags: Database["public"]["Tables"]["cosmic_tags"]["Row"][];
  items: Database["public"]["Tables"]["cosmic_collection_item"]["Row"][];
};

export class NoteService {
  private supabase: SupabaseClient<Database>;
  private tagService?: TagService;

  constructor(supabase: SupabaseClient<Database>, tagService?: TagService) {
    this.supabase = supabase;
    this.tagService = tagService;
  }

  /**
   * Set the tag service instance after construction to avoid circular dependencies
   */
  setTagService(tagService: TagService): void {
    this.tagService = tagService;
  }

  async getNotes(offset: number, limit: number): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from("cosmic_memory")
      .select(
        "*, cosmic_memory_tag_map(tag, created_at, tag(id, name, parent_tag))"
      )
      .order("updated_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map((note) => ({
      ...note,
      tags: note.cosmic_memory_tag_map?.map((map) => map.tag) || [],
    })) as Note[];
  }

  async getNoteById(id: number): Promise<NoteWithTagsAndItems | null> {
    const { data, error } = await this.supabase
      .from("cosmic_memory")
      .select(
        `
        *,
        cosmic_memory_tag_map(
          tag(*)
        ),
        cosmic_collection_item(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const tags = data.cosmic_memory_tag_map!.map((map) => map.tag);
    tags.sort((a, b) => a.name.localeCompare(b.name));

    return {
      ...data,
      metadata: data.metadata as any,
      tags: tags || [],
      items: data.cosmic_collection_item || [],
    } as NoteWithTagsAndItems;
  }

  async getTagsForNote(noteId: number): Promise<Tag[]> {
    const { data, error } = await this.supabase
      .from("cosmic_memory_tag_map")
      .select("tag(*)")
      .eq("note", noteId);

    if (error) throw error;

    return data.map((map) => map.tag) as Tag[];
  }

  async deleteTagFromNote(noteId: number, tagId: number): Promise<void> {
    const { error } = await this.supabase
      .from("cosmic_memory_tag_map")
      .delete()
      .eq("note", noteId)
      .eq("tag", tagId);

    if (error) throw error;

    const { error: tagError, count } = await this.supabase
      .from("cosmic_memory_tag_map")
      .select("*", { count: "exact", head: false })
      .eq("tag", tagId);

    if (tagError) throw tagError;

    if (count === 0) {
      const { error: tagDeleteError } = await this.supabase
        .from("cosmic_tags")
        .delete()
        .eq("id", tagId);

      if (tagDeleteError) throw tagDeleteError;
    } else {
      this.tagService?.setTagDirty(tagId);
    }
  }

  private async upsertTags(tags?: string[]): Promise<number[]> {
    let tagIds: number[] = [];
    if (tags && tags.length > 0) {
      const { data: existingTags, error: tagsError } = await this.supabase
        .from("cosmic_tags")
        .select("*")
        .in("name", tags);

      console.log("existingTags", existingTags);

      if (tagsError) throw tagsError;

      const newTags = tags.filter(
        (tag) => !existingTags.some((t) => t.name === tag)
      );

      if (newTags.length > 0) {
        const { data: newTagData, error: newTagError } = await this.supabase
          .from("cosmic_tags")
          .insert(newTags.map((tag) => ({ name: tag, dirty: true })))
          .select();

        if (newTagError) throw newTagError;

        tagIds.push(...newTagData.map((tag) => tag.id));
      }
      tagIds.push(...existingTags.map((tag) => tag.id));
    }

    return tagIds;
  }

  private async upsertTagsToNote(
    noteId: number,
    tags?: string[],
    tagIds?: number[]
  ): Promise<void> {
    let allTagIds = tagIds || [];
    allTagIds.push(...(await this.upsertTags(tags)));
    console.log("allTagIds", allTagIds);

    if (allTagIds.length > 0) {
      // First get existing tag mappings for this note
      const { data: existingMappings, error: fetchError } = await this.supabase
        .from("cosmic_memory_tag_map")
        .select("tag")
        .eq("note", noteId);

      if (fetchError) throw fetchError;

      // Extract existing tag IDs
      const existingTagIds = existingMappings.map((mapping) => mapping.tag);

      // Filter out tag IDs that are already mapped to this note
      const newTagIds = allTagIds.filter(
        (tagId) => !existingTagIds.includes(tagId)
      );

      // Only insert new tag mappings
      if (newTagIds.length > 0) {
        const { error } = await this.supabase
          .from("cosmic_memory_tag_map")
          .insert(newTagIds.map((tagId) => ({ note: noteId, tag: tagId })));

        if (error) throw error;
      }

      // Only set tags as dirty if tagService is available
      if (this.tagService) {
        for (const tagId of allTagIds) {
          this.tagService.setTagDirty(tagId);
        }
      }
    }
  }

  /**
   * Creates a new note with tags. Automatically creates new tags if they don't exist.
   * @param note The note to create
   * @returns The created note
   */
  async createNote(
    note: Omit<NoteInsert, "id" | "created_at" | "updated_at" | "embedding"> & {
      content: string;
      tags?: string[];
      tagIds: number[];
    }
  ): Promise<Note> {
    const embedding = note.content
      ? await generateEmbedding(note.content)
      : "[]";

    const similarNotes = await searchNotes(note.content, 3, 0.8);

    const category: Category = await generateNoteCategory(
      note.content,
      similarNotes
    );

    const { title, zone } = await generateNoteFields(note.content);

    const { data: noteData, error: noteError } = await this.supabase
      .from("cosmic_memory")
      .insert({
        ...note,
        title,
        zone,
        category,
        embedding,
      })
      .select()
      .single();

    if (noteError) throw noteError;
    if (!noteData) throw new Error("Note not created");
    await this.upsertTagsToNote(noteData.id, note.tags, note.tagIds);
    return noteData;
  }

  /**
   * Updates a note with new tags. Automatically creates new tags if they don't exist, or deletes the tag if it is not in the note.
   * @param id The id of the note to update
   * @param updates The updates to apply to the note
   * @returns The updated note
   */
  async updateNote(
    id: number,
    updates: Omit<NoteUpdate, "created_at"> & {
      tags?: string[];
      tagIds?: number[];
    }
  ): Promise<void> {
    const existingNote = await this.getNoteById(id);
    if (!existingNote) throw new Error("Note not found");
    console.log("updates", updates);

    if (updates.content && updates.content !== existingNote.content) {
      updates.embedding = await generateEmbedding(updates.content);
    }

    if (updates.tags) {
      await this.upsertTagsToNote(id, updates.tags, updates.tagIds);
      const existingTags = (await this.getNoteById(id))?.tags;
      const tagsToDelete = existingTags?.filter(
        (tag) => !updates.tags?.includes(tag.name)
      );
      if (tagsToDelete && tagsToDelete.length > 0) {
        await Promise.all(
          tagsToDelete.map((tag) => this.deleteTagFromNote(id, tag.id))
        );
      }
    }

    // If the note is being converted to a collection, convert it
    if (
      updates.category &&
      updates.category !== existingNote.category &&
      ITEM_CATEGORIES.includes(updates.category) &&
      existingNote.items.length === 0
    ) {
      const itemService = new ItemService(this.supabase);
      await itemService.saveNoteAsItems(existingNote, updates.category);
    }

    // Remove tags from updates since these are objects, and tags are tracked via tagmap
    delete updates.tags;
    delete updates.tagIds;

    if (Object.keys(updates).length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from("cosmic_memory")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  }

  async deleteNote(id: number): Promise<void> {
    const { data: noteTagMaps, error: noteTagMapsError } = await this.supabase
      .from("cosmic_memory_tag_map")
      .delete()
      .eq("note", id);

    const { error } = await this.supabase
      .from("cosmic_memory")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (noteTagMapsError) throw noteTagMapsError;
  }

  async getNotesByCategory(category: Category): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from("cosmic_memory")
      .select(
        `
        *,
        cosmic_memory_tag_map(
          tag(*)
        )
      `
      )
      .eq("category", category);

    if (error) throw error;

    return data.map((note) => ({
      ...note,
      metadata: note.metadata as any,
      tags: note.cosmic_memory_tag_map?.map((map) => map.tag) || [],
    })) as Note[];
  }

  async getNotesByZone(zone: Zone): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from("cosmic_memory")
      .select(
        `
        *,
        cosmic_memory_tag_map(
          tag(*)
        )
      `
      )
      .eq("zone", zone);

    if (error) throw error;

    return data.map((note) => ({
      ...note,
      metadata: note.metadata as any,
      tags: note.cosmic_memory_tag_map?.map((map) => map.tag) || [],
    })) as Note[];
  }

  async getNotesByTag(tagId: number): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from("cosmic_memory_tag_map")
      .select(
        `
        note:cosmic_memory(
          *,
          cosmic_memory_tag_map(
            tag(*)
          )
        )
      `
      )
      .eq("tag", tagId);

    if (error) throw error;

    return data
      .map((item) => item.note)
      .filter((note) => note !== null)
      .map((note) => ({
        ...note,
        metadata: note.metadata as any,
        tags: note.cosmic_memory_tag_map?.map((map) => map.tag) || [],
      })) as Note[];
  }

  async searchNotes(query: string): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from("cosmic_memory")
      .select(
        `
        *,
        cosmic_memory_tag_map(
          tag(*)
        )
      `
      )
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    if (error) throw error;

    return data.map((note) => ({
      ...note,
      metadata: note.metadata as any,
      tags: note.cosmic_memory_tag_map?.map((map) => map.tag) || [],
    })) as Note[];
  }

  async addTagToNote(noteId: number, tagId: number): Promise<void> {
    const { error } = await this.supabase
      .from("cosmic_memory_tag_map")
      .insert({ note: noteId, tag: tagId });

    if (error) throw error;
  }

  async removeTagFromNote(noteId: number, tagId: number): Promise<void> {
    const { error } = await this.supabase
      .from("cosmic_memory_tag_map")
      .delete()
      .eq("note", noteId)
      .eq("tag", tagId);

    if (error) throw error;
  }

  async refreshNote(noteId: number): Promise<NoteRow> {
    const { data, error } = await this.supabase
      .from("cosmic_memory")
      .select("content")
      .eq("id", noteId)
      .single();

    if (error) throw error;

    if (!data) throw new Error("Note not found");
    if (!data.content) throw new Error("Note content not found");

    const { title, zone, category } = await generateNoteFields(data.content);

    const { data: updatedNote, error: updateError } = await this.supabase
      .from("cosmic_memory")
      .update({ title, zone, category })
      .eq("id", noteId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Delete old tags
    const { error: deleteError } = await this.supabase
      .from("cosmic_memory_tag_map")
      .delete()
      .eq("note", noteId);

    if (deleteError) throw deleteError;

    // Check if tagService is available
    if (!this.tagService) {
      // If no tagService, just return the updated note without tags
      return updatedNote;
    }

    const tags = await this.tagService.getTagsForNote(data.content);

    await this.upsertTagsToNote(
      noteId,
      tags.map((tag) => tag.name)
    );

    return updatedNote;
  }
}
