import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/database.types";
import { Category, CompleteNote, Note, Tag, Zone } from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { ITEM_CATEGORIES } from "../constants";
import { generateEmbedding } from "../embeddings";
import { generateNoteCategory, generateNoteFields } from "./ai-service";
import { ClusterService } from "./cluster-service";
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
  private clusterService?: ClusterService;
  private itemService?: ItemService;
  constructor(
    supabase: SupabaseClient<Database>,
    tagService?: TagService,
    clusterService?: ClusterService,
    itemService?: ItemService
  ) {
    this.supabase = supabase;
    this.tagService = tagService;
    this.clusterService = clusterService;
    this.itemService = itemService;
  }

  /**
   * Set the tag service instance after construction to avoid circular dependencies
   */
  setTagService(tagService: TagService): void {
    this.tagService = tagService;
  }

  setClusterService(clusterService: ClusterService): void {
    this.clusterService = clusterService;
  }

  setItemService(itemService: ItemService): void {
    this.itemService = itemService;
  }

  async getNotesWithFilter(
    category?: Category,
    zone?: Zone,
    tags?: string[],
    tagIds?: number[]
  ): Promise<Note[]> {
    let query = this.supabase
      .from("cosmic_memory")
      .select(
        "*, cosmic_memory_tag_map(tag, created_at, tag(id, name, parent_tag))"
      )
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (zone) {
      query = query.eq("zone", zone);
    }

    // For tags and tagIds, we need to find the matching note IDs first
    let noteIdsToFilter: number[] | null = null;

    // Handle tag filtering by first getting the tag IDs, then finding notes with those tags
    if (tags && tags.length > 0) {
      const { data: tagData, error: tagError } = await this.supabase
        .from("cosmic_tags")
        .select("id")
        .in("name", tags);

      if (tagError) throw tagError;

      if (tagData && tagData.length > 0) {
        const matchedTagIds = tagData.map((tag) => tag.id);
        const { data: noteMappings, error: mappingError } = await this.supabase
          .from("cosmic_memory_tag_map")
          .select("note")
          .in("tag", matchedTagIds);

        if (mappingError) throw mappingError;

        if (noteMappings && noteMappings.length > 0) {
          noteIdsToFilter = noteMappings.map((mapping) => mapping.note);
        } else {
          return []; // No notes with these tags
        }
      } else {
        return []; // No matching tags found
      }
    }

    // Handle tagIds filtering
    if (tagIds && tagIds.length > 0) {
      const { data: noteMappings, error: mappingError } = await this.supabase
        .from("cosmic_memory_tag_map")
        .select("note")
        .in("tag", tagIds);

      if (mappingError) throw mappingError;

      if (noteMappings && noteMappings.length > 0) {
        const noteIds = noteMappings.map((mapping) => mapping.note);

        // If we already have noteIdsToFilter from the tags filter, get the intersection
        if (noteIdsToFilter) {
          noteIdsToFilter = noteIdsToFilter.filter((id) =>
            noteIds.includes(id)
          );
          if (noteIdsToFilter.length === 0) {
            return []; // No overlap between tags and tagIds filters
          }
        } else {
          noteIdsToFilter = noteIds;
        }
      } else {
        return []; // No notes with these tagIds
      }
    }

    // Apply the note IDs filter if we have any
    if (noteIdsToFilter) {
      query = query.in("id", noteIdsToFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((note) => ({
      ...note,
      tags: note.cosmic_memory_tag_map?.map((map) => map.tag) || [],
    })) as Note[];
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
      metadata: data.metadata as Record<string, unknown>,
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
    // Get the note to determine its category before deleting the tag
    const note = await this.getNoteById(noteId);

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
      // Mark the tag as dirty if it's not being deleted
      const promises = [this.tagService!.setTagDirty(tagId)];

      // Mark the cluster as dirty only if the tag still exists
      if (note) {
        promises.push(
          this.clusterService!.setClusterDirty(tagId, note.category)
        );
      }

      await Promise.all(promises);
    }
  }

  private async upsertTags(tags?: string[]): Promise<number[]> {
    const tagIds: number[] = [];
    if (tags && tags.length > 0) {
      const { data: existingTags, error: tagsError } = await this.supabase
        .from("cosmic_tags")
        .select("*")
        .in("name", tags);

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
    const allTagIds = tagIds || [];
    allTagIds.push(...(await this.upsertTags(tags)));

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

      // Get the note to determine its category
      const note = await this.getNoteById(noteId);

      const promises = [];
      for (const tagId of allTagIds) {
        promises.push(this.tagService!.setTagDirty(tagId));

        // Mark the cluster as dirty for each tag
        if (note) {
          promises.push(
            this.clusterService!.setClusterDirty(tagId, note.category)
          );
        }
      }

      await Promise.all(promises);
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
      title?: string;
      zone?: Zone;
      category?: Category;
      tags?: string[];
      tagIds?: number[];
    }
  ): Promise<Note> {
    const embedding = note.content
      ? await generateEmbedding(note.content)
      : "[]";

    let newNoteCategory = note.category;
    let newNoteTitle = note.title;
    let newNoteZone = note.zone;

    if (!newNoteCategory) {
      const similarNotes = await searchNotes(note.content, 3, 0.8);

      const category: Category = await generateNoteCategory(
        note.content,
        similarNotes
      );
      newNoteCategory = category;
    }

    if (!note.title || !note.zone) {
      const { title, zone } = await generateNoteFields(note.content);
      newNoteTitle = title;
      newNoteZone = zone;
    }

    const { data: noteData, error: noteError } = await this.supabase
      .from("cosmic_memory")
      .insert({
        ...note,
        title: newNoteTitle,
        zone: newNoteZone,
        category: newNoteCategory,
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

    // Get all tags associated with this note
    const tagsToMarkDirty = existingNote.tags.map((tag) => tag.id);

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

    // If the note category is changing, mark affected tags and clusters as dirty
    if (updates.category && updates.category !== existingNote.category) {
      // Mark clusters in both the old and new categories as dirty
      const allPromises = tagsToMarkDirty.flatMap((tagId) => [
        this.clusterService!.setClusterDirty(tagId, existingNote.category),
        this.clusterService!.setClusterDirty(tagId, updates.category),
        this.tagService!.setTagDirty(tagId),
      ]);

      // If the note is being converted to a collection, convert it
      if (
        ITEM_CATEGORIES.includes(updates.category) &&
        existingNote.items.length === 0
      ) {
        await this.itemService!.saveNoteAsItems(existingNote, updates.category);
      }

      await Promise.all(allPromises);
    } else {
      // If just content or other fields are changing, mark all associated tags and their clusters as dirty
      const allPromises = tagsToMarkDirty.flatMap((tagId) => [
        this.clusterService!.setClusterDirty(tagId),
        this.tagService!.setTagDirty(tagId),
      ]);

      await Promise.all(allPromises);
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
    const { error: noteTagMapsError } = await this.supabase
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
      metadata: note.metadata as Record<string, unknown>,
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
      metadata: note.metadata as Record<string, unknown>,
      tags: note.cosmic_memory_tag_map?.map((map) => map.tag) || [],
    })) as Note[];
  }

  async getCompleteNotesByTag(tagId: number): Promise<CompleteNote[]> {
    const { data, error } = await this.supabase
      .from("cosmic_memory_tag_map")
      .select(
        `
        note:cosmic_memory(
          *,
          cosmic_collection_item(*)
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
        metadata: note.metadata as Record<string, unknown>,
        tags: [],
        items: note.cosmic_collection_item || [],
      })) as CompleteNote[];
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
        metadata: note.metadata as Record<string, unknown>,
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
      metadata: note.metadata as Record<string, unknown>,
      tags: note.cosmic_memory_tag_map?.map((map) => map.tag) || [],
    })) as Note[];
  }

  async addTagToNote(noteId: number, tagId: number): Promise<void> {
    const { error } = await this.supabase
      .from("cosmic_memory_tag_map")
      .insert({ note: noteId, tag: tagId });

    if (error) throw error;

    const promises = [this.tagService!.setTagDirty(tagId)];

    // Get the note to determine its category
    const note = await this.getNoteById(noteId);
    if (note) {
      // Mark the cluster for this tag and category as dirty
      promises.push(this.clusterService!.setClusterDirty(tagId, note.category));
    }

    await Promise.all(promises);
  }

  async removeTagFromNote(noteId: number, tagId: number): Promise<void> {
    // Get the note to determine its category before removing the tag
    const note = await this.getNoteById(noteId);

    const { error } = await this.supabase
      .from("cosmic_memory_tag_map")
      .delete()
      .eq("note", noteId)
      .eq("tag", tagId);

    if (error) throw error;

    const promises = [this.tagService!.setTagDirty(tagId)];

    // Mark the cluster for this tag and category as dirty
    if (note) {
      promises.push(this.clusterService!.setClusterDirty(tagId, note.category));
    }

    await Promise.all(promises);
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
