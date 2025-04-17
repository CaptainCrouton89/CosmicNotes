import { Database } from "@/types/database.types";
import {
  Category,
  Cluster,
  CompleteCluster,
  CompleteItem,
  CompleteNote,
  CompleteTag,
  Item,
  Note,
  Tag,
  Zone,
} from "@/types/types";

/**
 * Maps a database note row to a Note object
 * @param dbNote Note row from database
 * @returns Note object
 */
export function mapDbNoteToNote(
  dbNote: Database["public"]["Tables"]["cosmic_memory"]["Row"]
): Note {
  return {
    id: dbNote.id,
    title: dbNote.title,
    content: dbNote.content,
    zone: dbNote.zone as Zone,
    category: dbNote.category as Category,
    created_at: dbNote.created_at,
    updated_at: dbNote.updated_at,
    metadata: dbNote.metadata,
  };
}

/**
 * Maps a database note with tags and items to a CompleteNote
 * @param dbNote Note row from database
 * @param tags Tags for the note
 * @param items Items for the note
 * @returns CompleteNote object
 */
export function mapDbNoteToCompleteNote(
  dbNote: Database["public"]["Tables"]["cosmic_memory"]["Row"],
  tags: Database["public"]["Tables"]["cosmic_tags"]["Row"][] = [],
  items: Database["public"]["Tables"]["cosmic_collection_item"]["Row"][] = []
): CompleteNote {
  return {
    ...mapDbNoteToNote(dbNote),
    tags: tags.map((tag) => mapDbTagToTag(tag)),
    items: items.map((item) => ({
      id: item.id,
      item: item.item,
      done: item.done,
      embedding: item.embedding || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })),
  };
}

/**
 * Maps a database tag row to a Tag object
 * @param dbTag Tag row from database
 * @returns Tag object
 */
export function mapDbTagToTag(
  dbTag: Database["public"]["Tables"]["cosmic_tags"]["Row"]
): Tag {
  return {
    id: dbTag.id,
    name: dbTag.name,
    created_at: dbTag.created_at,
    updated_at: dbTag.updated_at,
    dirty: dbTag.dirty,
  };
}

/**
 * Maps a database tag with notes and clusters to a CompleteTag
 * @param dbTag Tag row from database
 * @param notes Notes for the tag
 * @param clusters Clusters for the tag
 * @param noteCount Count of notes for the tag
 * @returns CompleteTag object
 */
export function mapDbTagToCompleteTag(
  dbTag: Database["public"]["Tables"]["cosmic_tags"]["Row"],
  notes: Database["public"]["Tables"]["cosmic_memory"]["Row"][] = [],
  clusters: Database["public"]["Tables"]["cosmic_cluster"]["Row"][] = [],
  noteCount: number = notes.length
): CompleteTag {
  return {
    ...mapDbTagToTag(dbTag),
    notes,
    clusters,
    note_count: noteCount,
  };
}

/**
 * Maps a database item row to an Item object
 * @param dbItem Item row from database
 * @returns Item object
 */
export function mapDbItemToItem(
  dbItem: Database["public"]["Tables"]["cosmic_collection_item"]["Row"]
): Item {
  return {
    id: dbItem.id,
    item: dbItem.item,
    done: dbItem.done,
    embedding: dbItem.embedding || undefined,
    created_at: dbItem.created_at,
    updated_at: dbItem.updated_at,
  };
}

/**
 * Maps a database item with memory and cluster to a CompleteItem
 * @param dbItem Item row from database
 * @param memory Memory for the item
 * @param cluster Cluster for the item
 * @returns CompleteItem object
 */
export function mapDbItemToCompleteItem(
  dbItem: Database["public"]["Tables"]["cosmic_collection_item"]["Row"],
  memory?: Database["public"]["Tables"]["cosmic_memory"]["Row"],
  cluster?: Database["public"]["Tables"]["cosmic_cluster"]["Row"]
): CompleteItem {
  return {
    ...mapDbItemToItem(dbItem),
    memory,
    cluster,
  };
}

/**
 * Maps a database cluster row to a Cluster object
 * @param dbCluster Cluster row from database
 * @returns Cluster object
 */
export function mapDbClusterToCluster(
  dbCluster: Database["public"]["Tables"]["cosmic_cluster"]["Row"]
): Cluster {
  return {
    id: dbCluster.id,
    category: dbCluster.category as Category,
    summary: dbCluster.summary,
    dirty: dbCluster.dirty,
    created_at: dbCluster.created_at,
    updated_at: dbCluster.updated_at,
  };
}

/**
 * Maps a database cluster with tag, notes, and items to a CompleteCluster
 * @param dbCluster Cluster row from database
 * @param tag Tag for the cluster
 * @param notes Notes for the cluster
 * @param clusterItems Items for the cluster
 * @returns CompleteCluster object
 */
export function mapDbClusterToCompleteCluster(
  dbCluster: Database["public"]["Tables"]["cosmic_cluster"]["Row"],
  tag: Database["public"]["Tables"]["cosmic_tags"]["Row"],
  notes: CompleteNote[] = [],
  clusterItems: Partial<
    Database["public"]["Tables"]["cosmic_collection_item"]["Row"]
  >[] = []
): CompleteCluster {
  const items: Item[] = clusterItems.map((item) => ({
    id: item.id!,
    item: item.item!,
    done: item.done!,
    embedding: item.embedding || undefined,
    created_at: item.created_at!,
    updated_at: item.updated_at!,
  }));

  return {
    ...mapDbClusterToCluster(dbCluster),
    tag: mapDbTagToTag(tag),
    note_count: notes.length,
    notes,
    cluster_items: items,
  };
}
