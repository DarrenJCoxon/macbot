// app/lib/embedding-utils.ts
import OpenAI from 'openai'; // Import OpenAI SDK

// Initialize OpenAI Client (uses OPENAI_API_KEY from environment)
const openai = new OpenAI();

// Define OpenAI model details
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const EXPECTED_DIMENSION = 768; // ** Crucial: Requesting this dimension **

/**
 * Generate single embedding for a text string using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.warn("[OpenAI Embed] Attempted to embed empty or invalid text.");
    return Array(EXPECTED_DIMENSION).fill(0); // Return zero vector
  }

  const cleanedText = text.replace(/\n/g, " ").trim();
  if (!cleanedText) {
    console.warn("[OpenAI Embed] Text became empty after cleaning.");
    return Array(EXPECTED_DIMENSION).fill(0);
  }

  console.log(`[OpenAI Embed] Generating embedding for query text (length: ${cleanedText.length}) using ${OPENAI_EMBEDDING_MODEL} (dim: ${EXPECTED_DIMENSION})...`);

  try {
    const response = await openai.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: [cleanedText], // API expects an array of strings
      // ** Request specific dimension **
      dimensions: EXPECTED_DIMENSION,
      encoding_format: "float", // Recommended format
    });

    // Validate response structure and extract embedding
    const embedding = response?.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      console.error("[OpenAI Embed] Unexpected response structure:", response);
      throw new Error(`Unexpected response structure from OpenAI API for ${OPENAI_EMBEDDING_MODEL}.`);
    }

    // Optional: Double-check dimension, though requesting it should ensure it
    if (embedding.length !== EXPECTED_DIMENSION) {
        console.warn(`[OpenAI Embed] Warning: Embedding dimension mismatch. Requested ${EXPECTED_DIMENSION}, got ${embedding.length}.`);
        // Handle this case if necessary (e.g., throw error)
    }

    console.log(`[OpenAI Embed] Embedding generated successfully (${embedding.length}d).`);
    return embedding;

  } catch (error) {
    console.error(`[OpenAI Embed] Error generating embedding with ${OPENAI_EMBEDDING_MODEL}:`, error);
    throw error; // Re-throw for upstream handling
  }
}

// --- REMOVED Seeding and other utility functions if no longer needed ---
// Keep formatRetrievedContext if used by chat route, ensure it accepts VectorSearchResult[]
/*
import { VectorSearchResult } from "@/app/types";

export function formatRetrievedContext(docs: VectorSearchResult[]): string {
    // ... implementation using VectorSearchResult ...
}
*/