// app/lib/embeddings.ts
import OpenAI from 'openai';
import { FileChunk } from '@/app/types';
import { PineconeRecord } from '@pinecone-database/pinecone';
import { PineconeDocumentMetadata } from './pinecone-client'; // Import updated metadata type

// Initialize OpenAI Client
const openai = new OpenAI();

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const EXPECTED_DIMENSION = 768; // Ensure this matches Pinecone index

export async function generateEmbeddings(
  chunks: FileChunk[]
): Promise<PineconeRecord<PineconeDocumentMetadata>[]> {
  if (!chunks || chunks.length === 0) {
    console.log("generateEmbeddings (OpenAI) called with empty chunks array.");
    return [];
  }
  console.log(`[OpenAI Embed] Generating embeddings for ${chunks.length} chunks using ${OPENAI_EMBEDDING_MODEL} (dim: ${EXPECTED_DIMENSION})...`);

  const textsToEmbed = chunks.map(chunk => chunk.content.replace(/\n/g, " "));
  const batchSize = 100;
  const allVectors: PineconeRecord<PineconeDocumentMetadata>[] = [];
  let totalTokensUsed = 0;

  for (let i = 0; i < textsToEmbed.length; i += batchSize) {
    const textBatch = textsToEmbed.slice(i, i + batchSize);
    const chunkBatch = chunks.slice(i, i + batchSize);
    console.log(`[OpenAI Embed Batch] Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(textsToEmbed.length / batchSize)}, size: ${textBatch.length}`);

    try {
      const response = await openai.embeddings.create({
        model: OPENAI_EMBEDDING_MODEL,
        input: textBatch,
        dimensions: EXPECTED_DIMENSION,
        encoding_format: "float",
      });

      if (response.usage) {
        console.log(`[OpenAI Embed Batch] Tokens used: Prompt=${response.usage.prompt_tokens}, Total=${response.usage.total_tokens}`);
        totalTokensUsed += response.usage.total_tokens;
      }

      if (!response?.data || response.data.length !== textBatch.length) {
        console.error("[OpenAI Embed Batch] Embedding response length/structure mismatch.", { expected: textBatch.length, received: response?.data?.length });
        throw new Error(`OpenAI embedding response length mismatch in batch: expected ${textBatch.length}, got ${response?.data?.length ?? 0}`);
      }

      const batchVectors = chunkBatch.map((chunk, indexInBatch) => {
        const embeddingData = response.data[indexInBatch];

        if (!embeddingData?.embedding || !Array.isArray(embeddingData.embedding) || embeddingData.embedding.length !== EXPECTED_DIMENSION) {
             console.warn(`[OpenAI Embed Batch] Invalid, missing, or dimension-mismatched embedding vector for chunk ${chunk.id} at index ${indexInBatch}. Skipping.`);
             return null; // Mark as invalid
        }

        // --- METADATA MAPPING (Updated) ---
        // Map from FileChunk.metadata to PineconeDocumentMetadata, converting types as needed
        const metadataForPinecone: PineconeDocumentMetadata = {
          fileName: chunk.metadata.fileName,
          // Convert numbers to strings for Pinecone compatibility/filtering
          chunkIndex: chunk.metadata.chunkIndex.toString(),
          pageNumber: chunk.metadata.pageNumber?.toString(), // Optional number to optional string
          content: chunk.content, // Store original chunk content
          uploadedAt: new Date().toISOString(), // Add timestamp

          // Map the new fields
          docTitle: chunk.metadata.docTitle,     // Optional string to optional string
          docSource: chunk.metadata.docSource,   // Optional string to optional string
          docType: chunk.metadata.docType,       // Optional string to optional string
        };
        // --- END METADATA MAPPING ---

        return {
          id: chunk.id,
          values: embeddingData.embedding,
          metadata: metadataForPinecone, // Use the correctly mapped metadata
        };
      });

      const validBatchVectors = batchVectors.filter(v => v !== null) as PineconeRecord<PineconeDocumentMetadata>[];
      allVectors.push(...validBatchVectors);

    } catch (batchError) {
      console.error(`[OpenAI Embed Batch] Failed to process batch starting at index ${i}:`, batchError);
      throw new Error(`Failed to process OpenAI embedding batch starting at index ${i}. Reason: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
    }
  }

  console.log(`Finished generating ${allVectors.length} total embedding records. Total tokens used (approx): ${totalTokensUsed}`);
  return allVectors;
}