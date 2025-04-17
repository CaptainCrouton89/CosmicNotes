import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Utility class for building type-safe Supabase queries
 * Helps reduce N+1 query problems by supporting nested selects
 */
export class QueryBuilder<T extends keyof Database["public"]["Tables"]> {
  constructor(private supabase: SupabaseClient<Database>, private table: T) {}

  /**
   * Base query builder with type safety
   * @param columns Columns to select
   * @returns Supabase select query builder
   */
  select(columns: string) {
    return this.supabase.from(this.table).select(columns);
  }

  /**
   * Helper for common nested queries
   * @param baseColumns Base table columns to select
   * @param relations Object mapping relation names to their columns
   * @returns Supabase select query builder with nested relations
   */
  selectWithRelations(baseColumns: string, relations: Record<string, string>) {
    let query = baseColumns;

    Object.entries(relations).forEach(([relation, columns]) => {
      query += `, ${relation}(${columns})`;
    });

    return this.select(query);
  }

  /**
   * Helper to fetch a record by id with nested relations
   * @param id Record ID
   * @param baseColumns Base table columns to select
   * @param relations Object mapping relation names to their columns
   * @returns Supabase query for a single record with relations
   */
  getByIdWithRelations(
    id: number | string,
    baseColumns: string = "*",
    relations: Record<string, string> = {}
  ) {
    return this.selectWithRelations(baseColumns, relations)
      .eq("id" as any, id)
      .single();
  }

  /**
   * Helper to get records filtered by a foreign key
   * @param foreignKey Foreign key column name
   * @param value Foreign key value
   * @param baseColumns Base table columns to select
   * @param relations Object mapping relation names to their columns
   * @returns Supabase query for records matching the foreign key
   */
  getByForeignKey(
    foreignKey: string,
    value: number | string,
    baseColumns: string = "*",
    relations: Record<string, string> = {}
  ) {
    return this.selectWithRelations(baseColumns, relations).eq(
      foreignKey as any,
      value
    );
  }
}

/**
 * Factory function to create a QueryBuilder for a specific table
 * @param supabase Supabase client instance
 * @param table Table name
 * @returns QueryBuilder instance for the specified table
 */
export function createQueryBuilder<
  T extends keyof Database["public"]["Tables"]
>(supabase: SupabaseClient<Database>, table: T): QueryBuilder<T> {
  return new QueryBuilder(supabase, table);
}
