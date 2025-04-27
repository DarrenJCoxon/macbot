// app/lib/embeddings.ts
import { FileChunk } from '@/app/types';
import { PineconeRecord } from '@pinecone-database/pinecone';
// Import the specific metadata type expected by insertVectors
import { PineconeDocumentMetadata } from './pinecone-client';

// For embeddings, you'll need to use an embedding model
// OpenAI's embedding API is common, but you can use any embedding service

// Placeholder/Mock function - Replace with your actual embedding logic
export async function generateEmbeddings(
  chunks: FileChunk[]
): Promise<PineconeRecord<PineconeDocumentMetadata>[]> {
  console.log(`Generating embeddings for ${chunks.length} chunks...`);

  // In a real implementation, call your embedding API here (e.g., OpenAI, Together.ai)
  // const embeddings = await callEmbeddingApi(chunks.map(c => c.content));

  // Mock implementation: Generate random vectors and format metadata correctly
  // CORRECTED: Removed unused 'index' parameter from map callback
  const vectors: PineconeRecord<PineconeDocumentMetadata>[] = chunks.map((chunk) => {
    // const actualEmbedding = embeddings[index]; // Use the real embedding here if not using mock

    // --- Metadata Formatting ---
    // Convert numbers from FileChunk metadata to strings for PineconeDocumentMetadata
    const metadataForPinecone: PineconeDocumentMetadata = {
      fileName: chunk.metadata.fileName,
      pageNumber: chunk.metadata.pageNumber?.toString(), // Convert number? to string | undefined
      chunkIndex: chunk.metadata.chunkIndex.toString(), // Convert number to string
      content: chunk.content,
      uploadedAt: new Date().toISOString(), // Add upload timestamp if desired
    };

    return {
      id: chunk.id, // Use the chunk ID generated earlier
      // values: actualEmbedding, // Use the real embedding vector
      // --- MOCK VALUES --- Dimension set to 1024 ---
      values: Array(768).fill(0).map(() => Math.random() - 0.5), // MOCK VALUES (768d)
      // --- END MOCK VALUES ---
      metadata: metadataForPinecone,
    };
  });

  console.log(`Finished generating ${vectors.length} embedding records.`);
  return vectors;
}

// Example using OpenAI (ensure you have the 'openai' package installed)
/*
import OpenAI from 'openai';

const openai = new OpenAI({ // Configure API key via environment variables
  apiKey: process.env.OPENAI_API_KEY,
});
// Choose a model that supports configurable dimensions if needed
const embeddingModel = "text-embedding-3-small"; // Example model
// Set desired dimension (MUST match Pinecone index dimension)
const embeddingDimension = 1024;

export async function generateEmbeddingsWithOpenAI(
  chunks: FileChunk[]
): Promise<PineconeRecord<PineconeDocumentMetadata>[]> {
  if (!chunks || chunks.length === 0) {
    return [];
  }
  console.log(`Generating OpenAI embeddings for ${chunks.length} chunks using ${embeddingModel} (dim: ${embeddingDimension})...`);

  const textsToEmbed = chunks.map(chunk => chunk.content.replace(/\n/g, " ")); // Clean text slightly

  try {
    // Process in batches if necessary (OpenAI has input limits)
    const batchSize = 100; // Example batch size, check OpenAI limits
    const allVectors: PineconeRecord<PineconeDocumentMetadata>[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
        const batchChunks = chunks.slice(i, i + batchSize);
        const batchTexts = textsToEmbed.slice(i, i + batchSize);
        console.log(`Processing OpenAI batch ${Math.floor(i/batchSize)+1}, size: ${batchTexts.length}`);

        const response = await openai.embeddings.create({
          model: embeddingModel,
          input: batchTexts,
          dimensions: embeddingDimension // Specify the desired dimension
        });

        if (response.data.length !== batchTexts.length) {
          throw new Error(`OpenAI embedding response length mismatch in batch: expected ${batchTexts.length}, got ${response.data.length}`);
        }

        // CORRECTED: Removed unused 'index' parameter from map callback
        const batchVectors = batchChunks.map((chunk) => {
            const metadataForPinecone: PineconeDocumentMetadata = {
                fileName: chunk.metadata.fileName,
                pageNumber: chunk.metadata.pageNumber?.toString(),
                chunkIndex: chunk.metadata.chunkIndex.toString(),
                content: chunk.content, // Store original chunk content
                uploadedAt: new Date().toISOString(),
            };
            // Find the corresponding embedding using the original index 'i' + inner index 'idx' or by matching content/ID if needed.
            // Assuming the response order matches the input batch order:
            const embeddingIndexInResponse = batchChunks.indexOf(chunk); // Find index within the current batch

            if (embeddingIndexInResponse === -1) {
                // This should not happen if response matches request length, but good to check
                throw new Error(`Could not find chunk in OpenAI response batch for chunk ID ${chunk.id}`);
            }


            return {
                id: chunk.id,
                values: response.data[embeddingIndexInResponse].embedding,
                metadata: metadataForPinecone,
            };
        });
        allVectors.push(...batchVectors);
    } // End batch loop

    console.log(`Finished generating ${allVectors.length} OpenAI embedding records.`);
    return allVectors;

  } catch (error) {
    console.error("Error generating OpenAI embeddings:", error);
    throw error;
  }
}
*/