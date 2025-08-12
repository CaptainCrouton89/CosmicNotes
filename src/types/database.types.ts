export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cosmic_cluster: {
        Row: {
          category: Database["public"]["Enums"]["note_category"]
          chat_history: Json | null
          created_at: string
          dirty: boolean
          embedding: string
          id: number
          summary: string
          tag: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["note_category"]
          chat_history?: Json | null
          created_at?: string
          dirty?: boolean
          embedding: string
          id?: number
          summary: string
          tag: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["note_category"]
          chat_history?: Json | null
          created_at?: string
          dirty?: boolean
          embedding?: string
          id?: number
          summary?: string
          tag?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmic_cluster_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "cosmic_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmic_collection_item: {
        Row: {
          cluster: number | null
          created_at: string
          done: boolean
          embedding: string | null
          id: number
          item: string
          memory: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cluster?: number | null
          created_at?: string
          done?: boolean
          embedding?: string | null
          id?: number
          item: string
          memory?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cluster?: number | null
          created_at?: string
          done?: boolean
          embedding?: string | null
          id?: number
          item?: string
          memory?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmic_collection_item_cluster_fkey"
            columns: ["cluster"]
            isOneToOne: false
            referencedRelation: "cosmic_cluster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmic_collection_item_memory_fkey"
            columns: ["memory"]
            isOneToOne: false
            referencedRelation: "cosmic_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmic_memory: {
        Row: {
          category: Database["public"]["Enums"]["note_category"]
          chat_history: Json | null
          content: string
          created_at: string
          embedding: string
          id: number
          metadata: Json
          title: string
          type: Database["public"]["Enums"]["cosmic_memory_type"]
          updated_at: string
          user_id: string | null
          zone: Database["public"]["Enums"]["note_zone"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["note_category"]
          chat_history?: Json | null
          content?: string
          created_at?: string
          embedding: string
          id?: number
          metadata?: Json
          title?: string
          type?: Database["public"]["Enums"]["cosmic_memory_type"]
          updated_at?: string
          user_id?: string | null
          zone: Database["public"]["Enums"]["note_zone"]
        }
        Update: {
          category?: Database["public"]["Enums"]["note_category"]
          chat_history?: Json | null
          content?: string
          created_at?: string
          embedding?: string
          id?: number
          metadata?: Json
          title?: string
          type?: Database["public"]["Enums"]["cosmic_memory_type"]
          updated_at?: string
          user_id?: string | null
          zone?: Database["public"]["Enums"]["note_zone"]
        }
        Relationships: []
      }
      cosmic_memory_tag_map: {
        Row: {
          created_at: string
          id: number
          note: number
          tag: number
        }
        Insert: {
          created_at?: string
          id?: number
          note: number
          tag: number
        }
        Update: {
          created_at?: string
          id?: number
          note?: number
          tag?: number
        }
        Relationships: [
          {
            foreignKeyName: "cosmic_memory_tag_map_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "cosmic_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmic_tags_note_fkey"
            columns: ["note"]
            isOneToOne: false
            referencedRelation: "cosmic_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmic_note_review: {
        Row: {
          created_at: string
          id: number
          review: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          review: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          review?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cosmic_tags: {
        Row: {
          created_at: string
          dirty: boolean
          id: number
          name: string
          parent_tag: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dirty?: boolean
          id?: number
          name: string
          parent_tag?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dirty?: boolean
          id?: number
          name?: string
          parent_tag?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cosmic_user_settings: {
        Row: {
          chat_prompt: string | null
          chat_system_instructions: string | null
          cluster_prompt: string | null
          created_at: string
          id: number
          merge_tag_prompt: string | null
          pinned_categories: Json
          tag_prompt: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          chat_prompt?: string | null
          chat_system_instructions?: string | null
          cluster_prompt?: string | null
          created_at?: string
          id?: number
          merge_tag_prompt?: string | null
          pinned_categories?: Json
          tag_prompt?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          chat_prompt?: string | null
          chat_system_instructions?: string | null
          cluster_prompt?: string | null
          created_at?: string
          id?: number
          merge_tag_prompt?: string | null
          pinned_categories?: Json
          tag_prompt?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string | null
          description: string | null
          id: string
          parent_id: string | null
          position: number | null
          priority: Database["public"]["Enums"]["priority"] | null
          project_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          parent_id?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["priority"] | null
          project_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          parent_id?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["priority"] | null
          project_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_cluster_with_relations: {
        Args: { cluster_id: number }
        Returns: Json
      }
      get_page_parents: {
        Args: { page_id: number }
        Returns: {
          id: number
          parent_page_id: number
          path: string
          meta: Json
        }[]
      }
      get_requirements_with_tags: {
        Args: { project_id_param: string }
        Returns: {
          id: string
          title: string
          description: string
          type: Database["public"]["Enums"]["requirement_type"]
          priority: Database["public"]["Enums"]["requirement_priority"]
          status: Database["public"]["Enums"]["requirement_status"]
          project_id: string
          created_at: string
          updated_at: string
          user_id: string
          tags: string[]
        }[]
      }
      get_tag_with_relations: {
        Args: { tag_id: number }
        Returns: Json
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_clusters: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: Database["public"]["CompositeTypes"]["matched_cluster"][]
      }
      match_conversation_messages: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          filter_conversation_id?: number
        }
        Returns: {
          id: number
          conversation_id: number
          role: string
          content: string
          created_at: string
          similarity: number
        }[]
      }
      match_notes: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: Database["public"]["CompositeTypes"]["matched_note"][]
      }
      match_page_sections: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
        }
        Returns: {
          id: number
          page_id: number
          slug: string
          heading: string
          content: string
          similarity: number
        }[]
      }
      search_notes_with_tags: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          filter_category?: string
          filter_zone?: string
          filter_tag_ids?: number[]
        }
        Returns: Json[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      cosmic_memory_type: "note" | "collection"
      note_category:
        | "to-do"
        | "scratchpad"
        | "collection"
        | "brainstorm"
        | "journal"
        | "meeting"
        | "research"
        | "learning"
        | "feedback"
      note_zone: "personal" | "work"
      priority: "low" | "medium" | "high"
      requirement_priority: "low" | "medium" | "high" | "critical"
      requirement_status:
        | "draft"
        | "proposed"
        | "approved"
        | "rejected"
        | "implemented"
        | "verified"
      requirement_type:
        | "functional"
        | "non-functional"
        | "technical"
        | "user_story"
      status: "open" | "in progress" | "completed"
    }
    CompositeTypes: {
      matched_cluster: {
        id: number | null
        tag: number | null
        summary: string | null
        created_at: string | null
        updated_at: string | null
        embedding: string | null
        score: number | null
      }
      matched_note: {
        id: number | null
        title: string | null
        content: string | null
        zone: Database["public"]["Enums"]["note_zone"] | null
        category: Database["public"]["Enums"]["note_category"] | null
        created_at: string | null
        updated_at: string | null
        embedding: string | null
        score: number | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cosmic_memory_type: ["note", "collection"],
      note_category: [
        "to-do",
        "scratchpad",
        "collection",
        "brainstorm",
        "journal",
        "meeting",
        "research",
        "learning",
        "feedback",
      ],
      note_zone: ["personal", "work"],
      priority: ["low", "medium", "high"],
      requirement_priority: ["low", "medium", "high", "critical"],
      requirement_status: [
        "draft",
        "proposed",
        "approved",
        "rejected",
        "implemented",
        "verified",
      ],
      requirement_type: [
        "functional",
        "non-functional",
        "technical",
        "user_story",
      ],
      status: ["open", "in progress", "completed"],
    },
  },
} as const
