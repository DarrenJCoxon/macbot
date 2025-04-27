// app/lib/embeddings.ts
import OpenAI from 'openai'; // Import OpenAI SDK
import { FileChunk } from '@/app/types';
import { PineconeRecord } from '@pinecone-database/pinecone';
import { PineconeDocumentMetadata } from './pinecone-client'; // Import metadata type

// Initialize OpenAI Client (uses OPENAI_API_KEY from environment)
const openai = new OpenAI();

// --- OpenAI Configuration ---
// ** Ensure these match the settings in embedding-utils.ts and pinecone-client.ts **
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const EXPECTED_DIMENSION = 768; // Requesting 768 dimensions
// --- End OpenAI Configuration ---

/**
 * Generate embeddings for multiple FileChunks using OpenAI API - CORRECTED
 */
export async function generateEmbeddings(
  chunks: FileChunk[]
): Promise<PineconeRecord<PineconeDocumentMetadata>[]> {
  // Handle empty input
  if (!chunks || chunks.length === 0) {
    console.log("generateEmbeddings (OpenAI) called with empty chunks array.");
    return [];
  }
  console.log(`[OpenAI Embed] Generating embeddings for ${chunks.length} chunks using ${OPENAI_EMBEDDING_MODEL} (dim: ${EXPECTED_DIMENSION})...`);

  // Prepare texts for embedding, clean slightly by replacing newlines
  const textsToEmbed = chunks.map(chunk => chunk.content.replace(/\n/g, " "));

  // Process texts in batches suitable for the API
  const batchSize = 100; // OpenAI generally handles larger batches, adjust if needed
  const allVectors: PineconeRecord<PineconeDocumentMetadata>[] = [];
  let totalEmbeddingsGenerated = 0;
  let totalTokensUsed = 0; // Optional: track token usage

  for (let i = 0; i < textsToEmbed.length; i += batchSize) {
    const textBatch = textsToEmbed.slice(i, i + batchSize);
    const chunkBatch = chunks.slice(i, i + batchSize); // Keep corresponding chunk objects
    console.log(`[OpenAI Embed Batch] Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(textsToEmbed.length / batchSize)}, size: ${textBatch.length}`);

    try {
      // Call OpenAI API for the current batch
      const response = await openai.embeddings.create({
        model: OPENAI_EMBEDDING_MODEL,
        input: textBatch, // Send array of strings
        dimensions: EXPECTED_DIMENSION, // Request specific dimension
        encoding_format: "float", // Recommended format
      });

       // Log token usage (optional)
       if (response.usage) {
           console.log(`[OpenAI Embed Batch] Tokens used: Prompt=${response.usage.prompt_tokens}, Total=${response.usage.total_tokens}`);
           totalTokensUsed += response.usage.total_tokens;
       }

      // Validate response structure and length
      if (!response?.data || response.data.length !== textBatch.length) {
        // Log the actual response for debugging if possible
        console.error("[OpenAI Embed Batch] Embedding response length/structure mismatch.", { expected: textBatch.length, received: response?.data?.length });
        throw new Error(`OpenAI embedding response length mismatch in batch: expected ${textBatch.length}, got ${response?.data?.length ?? 0}`);
      }

      // Combine chunk metadata with the generated embeddings
      const batchVectors = chunkBatch.map((chunk, indexInBatch) => {
        const embeddingData = response.data[indexInBatch];

        // Validate individual embedding data
        if (!embeddingData?.embedding || !Array.isArray(embeddingData.embedding)) {
             console.warn(`[OpenAI Embed Batch] Invalid or missing embedding vector for chunk ${chunk.id} at index ${indexInBatch}. Skipping.`);
             return null; // Mark as invalid to filter out later
        }
         // Optional strict dimension check for each vector
         if (embeddingData.embedding.length !== EXPECTED_DIMENSION) {
             console.warn(`[OpenAI Embed Batch] Embedding dimension mismatch for chunk ${chunk.id}. Expected ${EXPECTED_DIMENSION}, got ${embeddingData.embedding.length}. Skipping.`);
             return null;
         }


        // Format metadata according to PineconeDocumentMetadata (strings for numbers)
        const metadataForPinecone: PineconeDocumentMetadata = {
          fileName: chunk.metadata.fileName,
          pageNumber: chunk.metadata.pageNumber?.toString(), // Number? to String | undefined
          chunkIndex: chunk.metadata.chunkIndex.toString(), // Number to String
          content: chunk.content, // Store original chunk content
          uploadedAt: new Date().toISOString(), // Add timestamp
        };

        // Create the record for Pinecone
        return {
          id: chunk.id, // Use the pre-generated chunk ID
          values: embeddingData.embedding, // Use the corresponding embedding
          metadata: metadataForPinecone,
        };
      });

      // Filter out any nulls that resulted from embedding errors
      const validBatchVectors = batchVectors.filter(v => v !== null) as PineconeRecord<PineconeDocumentMetadata>[];
      allVectors.push(...validBatchVectors);
      totalEmbeddingsGenerated += validBatchVectors.length; // Count only valid ones


    } catch (batchError) {
      console.error(`[OpenAI Embed Batch] Failed to process batch starting at index ${i}:`, batchError);
      // Stop processing entirely on batch failure to avoid partial uploads
      throw new Error(`Failed to process OpenAI embedding batch starting at index ${i}. Reason: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
    }

  } // End batch loop

  console.log(`Finished generating ${totalEmbeddingsGenerated} total embedding records. Total tokens used (approx): ${totalTokensUsed}`);
  return allVectors;
}

// --- REMOVED Hugging Face IMPLEMENTATION and Mock Implementation ---