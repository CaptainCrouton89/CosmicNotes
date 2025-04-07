import { generateEmbedding } from "@/lib/embeddings";
import { ApplicationError, UserError } from "@/lib/errors";
import { generateAndSaveTags } from "@/lib/tags";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Define interface for our note data
interface NoteData {
  content: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const requestData = await req.json();

    if (!requestData) {
      throw new UserError("Missing request data");
    }

    const { content, metadata = {} } = requestData as NoteData;

    if (!content) {
      throw new UserError("Missing content in request data");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get embeddings from OpenAI using our utility function
    const embedding = await generateEmbedding(content);

    // Save the note with embedding to the cosmic_memory table
    const { error: insertError, data: savedNote } = await supabaseClient
      .from("cosmic_memory")
      .insert({
        content,
        created_at: new Date().toISOString(),
        embedding,
        metadata,
      })
      .select()
      .limit(1)
      .single();

    if (insertError) {
      throw new ApplicationError("Failed to save note", {
        supabaseError: insertError,
      });
    }

    // Generate and save tags for the new note
    try {
      await generateAndSaveTags(content, savedNote.id);
    } catch (tagError) {
      console.error("Error generating tags:", tagError);
      // Don't fail the whole request if tag generation fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        note: savedNote,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    return new Response(
      JSON.stringify({
        error: "There was an error processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Validate pagination parameters
    if (page < 1 || isNaN(page)) {
      throw new UserError("Invalid page parameter");
    }

    if (limit < 1 || limit > 100 || isNaN(limit)) {
      throw new UserError("Invalid limit parameter, must be between 1 and 100");
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Query notes with pagination and sorting
    const {
      data: notes,
      error,
      count,
    } = await supabaseClient
      .from("cosmic_memory")
      .select("*, cosmic_tags(tag, confidence, created_at)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ApplicationError("Failed to fetch notes", {
        supabaseError: error,
      });
    }

    const cleanedNotes = notes.map((note) => {
      return {
        ...note,
        cosmic_tags: note.cosmic_tags.sort(
          (a: { confidence: number }, b: { confidence: number }) =>
            b.confidence - a.confidence
        ),
      };
    });

    // Calculate total pages
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return new Response(
      JSON.stringify({
        success: true,
        notes: cleanedNotes,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    return new Response(
      JSON.stringify({
        error: "There was an error processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
