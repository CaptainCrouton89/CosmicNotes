import { ApplicationError } from "@/lib/errors";
import { Configuration, OpenAIApi } from "openai-edge";

const openAiKey = process.env.OPENAI_KEY!;

const config = new Configuration({
  apiKey: openAiKey,
});
const openai = new OpenAIApi(config);

/**
 * Generates an embedding for the given text content using OpenAI
 * @param content The text content to embed
 * @returns The embedding vector as a string (for Supabase pgvector compatibility)
 */
export async function generateEmbedding(content: string): Promise<string> {
  // OpenAI recommends replacing newlines with spaces for best results
  const input = content.replace(/\n/g, " ");

  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input,
  });

  if (!embeddingResponse.ok) {
    const error = await embeddingResponse.json();
    throw new ApplicationError("Failed to generate embedding", error);
  }

  const embeddingData = await embeddingResponse.json();

  if (
    !embeddingData ||
    !embeddingData.data ||
    !Array.isArray(embeddingData.data) ||
    embeddingData.data.length === 0
  ) {
    throw new ApplicationError(
      "Invalid embedding response format",
      embeddingData
    );
  }

  const { embedding } = embeddingData.data[0];

  if (!embedding) {
    throw new ApplicationError(
      "Missing embedding in response data",
      embeddingData.data[0]
    );
  }

  // Convert the embedding array to a string for Supabase pgvector
  return JSON.stringify(embedding);
}
