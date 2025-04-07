import { ApplicationError, UserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { Configuration, OpenAIApi } from "openai-edge";

const openAiKey = process.env.OPENAI_API_KEY!;

const config = new Configuration({
  apiKey: openAiKey,
});
const openai = new OpenAIApi(config);

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get("query");
    const matchCount = parseInt(url.searchParams.get("matchCount") || "10", 10);
    const matchThreshold = parseFloat(
      url.searchParams.get("matchThreshold") || "0.5"
    );

    if (!query) {
      throw new UserError("Missing query parameter");
    }

    // Initialize Supabase client
    const supabaseClient = await createClient();

    // Get embedding for the query
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: query.replace(/\n/g, " "),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.json();
      throw new ApplicationError("Failed to generate embedding", error);
    }

    const embeddingData = await embeddingResponse.json();
    const [{ embedding }] = embeddingData.data;

    // Search for similar notes using vector similarity
    const { data: notes, error } = await supabaseClient.rpc("match_notes", {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      throw new ApplicationError("Failed to search notes", {
        supabaseError: error,
      });
    }

    return new Response(
      JSON.stringify({
        notes: notes || [],
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
