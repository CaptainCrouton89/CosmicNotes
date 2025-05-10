import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

export type UserSettings =
  Database["public"]["Tables"]["cosmic_user_settings"]["Row"];
export type UserSettingsInput = Partial<
  Database["public"]["Tables"]["cosmic_user_settings"]["Insert"]
>;

export class SettingsService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Get user settings
   * Creates default settings if none exist
   */
  async getSettings(): Promise<UserSettings> {
    // Try to fetch existing settings
    const { data: settings, error } = await this.supabase
      .from("cosmic_user_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      // If no settings found, create default settings
      if (error.code === "PGRST116") {
        const defaultSettings = {
          chat_prompt: "How can I help you today?",
          chat_system_instructions: "You are a helpful assistant.",
          cluster_prompt: "Cluster similar items together.",
          tag_prompt: "Generate relevant tags for this content.",
          merge_tag_prompt: "Suggest tags to merge.",
          pinned_categories: [],
        };

        const { data: newSettings, error: insertError } = await this.supabase
          .from("cosmic_user_settings")
          .insert([defaultSettings])
          .select("*")
          .single();

        if (insertError) {
          throw new Error(
            `Failed to create default settings: ${insertError.message}`
          );
        }

        return newSettings;
      }

      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    return settings;
  }

  /**
   * Update user settings
   * Creates settings if they don't exist
   */
  async updateSettings(
    settingsInput: UserSettingsInput
  ): Promise<UserSettings> {
    // Ensure pinned_categories is an array if provided, otherwise keep as is or default to [] if it's a new insert.
    if (
      settingsInput.pinned_categories &&
      !Array.isArray(settingsInput.pinned_categories)
    ) {
      // Or handle error, for now, let's assume it should be an array or will be handled by DB JSON conversion
    }

    // Check if settings exist
    const { data: existingSettings, error: checkError } = await this.supabase
      .from("cosmic_user_settings")
      .select("id")
      .limit(1)
      .single();

    if (checkError && checkError.code === "PGRST116") {
      // No settings exist yet, insert new
      const { data: insertedSettings, error: insertError } = await this.supabase
        .from("cosmic_user_settings")
        .insert([
          {
            ...settingsInput,
            pinned_categories: settingsInput.pinned_categories || [],
          },
        ])
        .select("*")
        .single();

      if (insertError) {
        throw new Error(`Failed to create settings: ${insertError.message}`);
      }

      return insertedSettings;
    } else if (checkError) {
      throw new Error(
        `Failed to check existing settings: ${checkError.message}`
      );
    }

    // Update existing settings
    const { data: updatedSettings, error: updateError } = await this.supabase
      .from("cosmic_user_settings")
      .update(settingsInput)
      .eq("id", existingSettings.id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(`Failed to update settings: ${updateError.message}`);
    }

    return updatedSettings;
  }
}
