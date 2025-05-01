// app/lib/pinecone-client.ts
import {
  Pinecone,
  PineconeRecord,
} from '@pinecone-database/pinecone';
import { VectorSearchResult } from '@/app/types';

// --- Environment Variables ---
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX;

if (!pineconeApiKey) {
  console.error('ERROR: Missing Pinecone API key. Please set PINECONE_API_KEY environment variable.');
}
if (!pineconeIndexName) {
  console.error('ERROR: Missing Pinecone index name. Please set PINECONE_INDEX environment variable.');
}

// --- Metadata Type Definition for Pinecone Storage ---
// This defines how metadata should be structured when STORED in Pinecone.
// ALL values must be strings, numbers, booleans, or lists of strings for filtering.
export type PineconeDocumentMetadata = {
  // Existing fields (ensure types match Pinecone requirements - typically string/number/boolean)
  fileName: string;      // string - OK
  chunkIndex: string;    // Store as string (safer for Pinecone filtering)
  content: string;       // Store the original text chunk content - string OK
  pageNumber?: string;   // Store as string if present (optional)
  uploadedAt?: string;   // Optional: Timestamp as ISO string - string OK

  // --- ADDED FIELDS (mirroring FileChunk, ensuring Pinecone compatibility) ---
  docTitle?: string;     // string OK
  docSource?: string;    // string OK
  docType?: string;      // string OK
  // --- END ADDED FIELDS ---
};

// --- Initialize Pinecone Client ---
const pinecone = new Pinecone({
  apiKey: pineconeApiKey || 'MISSING_API_KEY',
});

// --- Get or Create Index Function ---
// (Keep this function as it was, ensuring dimension is correct, e.g., 768 for text-embedding-3-small)
export const getIndex = async () => {
  if (!pineconeIndexName) {
    throw new Error("Pinecone index name is not configured.");
  }
  console.log(`Attempting to get or create Pinecone index: ${pineconeIndexName}`);
  try {
    // 1. Try describeIndex first
    await pinecone.describeIndex(pineconeIndexName);
    console.log(`Index '${pineconeIndexName}' found.`);
    return pinecone.index<PineconeDocumentMetadata>(pineconeIndexName);
  } catch (error: unknown) {
    // 2. Check if it's a "Not Found" error
    let isNotFoundError = false;
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const errorStatus = typeof error === 'object' && error !== null && 'status' in error ? (error as { status: number }).status : undefined;

    if (errorStatus === 404 || errorMessage.includes('not found')) {
        isNotFoundError = true;
        console.log(`Index '${pineconeIndexName}' not found. Attempting creation...`);
    }

    // 3. If not found, create it
    if (isNotFoundError) {
      try {
        await pinecone.createIndex({
          name: pineconeIndexName,
          dimension: 768, // *** Make sure this matches your embedding model dimension ***
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }, // Or your spec
        });
        console.log(`Index '${pineconeIndexName}' creation initiated. Waiting ~60s...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
        console.log(`Index '${pineconeIndexName}' assumed ready.`);
        return pinecone.index<PineconeDocumentMetadata>(pineconeIndexName);
      } catch (creationError: unknown) {
        // 4. Handle creation errors (like 409 Conflict)
        const creationErrorMessage = creationError instanceof Error ? creationError.message.toLowerCase() : '';
        const creationErrorStatus = typeof creationError === 'object' && creationError !== null && 'status' in creationError ? (creationError as { status: number }).status : undefined;

        console.error(`Failed to create index '${pineconeIndexName}':`, creationError);
        if (creationErrorStatus === 409 || creationErrorMessage.includes('already exists')) {
             console.warn(`Index creation conflict (409). Assuming index exists.`);
             return pinecone.index<PineconeDocumentMetadata>(pineconeIndexName);
         }
        throw creationError; // Re-throw other creation errors
      }
    } else {
      // 5. Re-throw unexpected describeIndex errors
      console.error(`Unexpected error describing index '${pineconeIndexName}':`, error);
      throw error;
    }
  }
};


// --- Insert Vectors Function ---
// Expects vectors with metadata matching PineconeDocumentMetadata
export const insertVectors = async (
  vectors: PineconeRecord<PineconeDocumentMetadata>[]
) => {
  if (!pineconeIndexName) throw new Error("Pinecone index name is not configured.");
  if (!vectors || vectors.length === 0) {
    console.warn("insertVectors called with no vectors.");
    return; // Return void or boolean as appropriate for your logic
  }
  try {
    const index = await getIndex();
    console.log(`Inserting ${vectors.length} vectors into index '${pineconeIndexName}'`);
    const batchSize = 100; // Recommended batch size
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      console.log(`Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)} (size: ${batch.length})`);
      await index.upsert(batch);
    }
    console.log(`Successfully inserted ${vectors.length} vectors.`);
    // return true; // Optional: return success indicator
  } catch (error) {
    console.error('Error inserting vectors:', error);
    throw error; // Re-throw to be handled by the caller
  }
};


// --- Query Vectors Function ---
// Fetches similar chunks and formats the result into VectorSearchResult[]
export const querySimilarChunks = async (
  queryEmbedding: number[],
  topK: number = 5,
  filter?: Record<string, string | number | boolean | string[]> // Optional filter object
): Promise<VectorSearchResult[]> => {
  if (!pineconeIndexName) throw new Error("Pinecone index name is not configured.");
  if (!queryEmbedding || queryEmbedding.length === 0) {
    console.error("querySimilarChunks called with empty query embedding.");
    return [];
  }

  // *** Verify embedding dimension again ***
  const EXPECTED_DIMENSION = 768;
  if (queryEmbedding.length !== EXPECTED_DIMENSION) {
       console.error(`Query embedding dimension mismatch. Expected ${EXPECTED_DIMENSION}, got ${queryEmbedding.length}.`);
       return [];
  }

  try {
    const index = await getIndex();
    console.log(`Querying index '${pineconeIndexName}' with topK=${topK}${filter ? ` and filter: ${JSON.stringify(filter)}` : ''}.`);

    // Construct the query, including the optional filter
    const queryOptions: Parameters<typeof index.query>[0] = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true, // Crucial to get metadata back
        ...(filter && { filter }), // Conditionally add filter if provided
    };

    const queryResponse = await index.query(queryOptions);
    console.log(`Query returned ${queryResponse.matches?.length ?? 0} matches.`);

    // Map Pinecone results to your VectorSearchResult type
    const results: VectorSearchResult[] = [];
    if (queryResponse.matches) {
        for (const match of queryResponse.matches) {
            // Type assertion is okay here if we're confident about the metadata structure
            const metadata = match.metadata as PineconeDocumentMetadata | undefined;

            // Basic validation of essential metadata fields
            if (!metadata || typeof metadata.content !== 'string' || typeof metadata.fileName !== 'string' || typeof metadata.chunkIndex !== 'string') {
                 console.warn(`Skipping match ${match.id} due to missing essential metadata (content, fileName, chunkIndex). Metadata received:`, metadata);
                 continue;
            }

            // Parse chunkIndex back to number
            const chunkIndex = parseInt(metadata.chunkIndex, 10);
            if (isNaN(chunkIndex)) {
                console.warn(`Skipping match ${match.id} due to invalid chunkIndex: '${metadata.chunkIndex}'`);
                continue;
            }

            // Parse pageNumber back to number if present
            let pageNumber: number | undefined = undefined;
            if (typeof metadata.pageNumber === 'string') {
                 const parsedPage = parseInt(metadata.pageNumber, 10);
                 if (!isNaN(parsedPage)) {
                     pageNumber = parsedPage;
                 } else {
                     console.warn(`Match ${match.id}: Could not parse pageNumber '${metadata.pageNumber}'.`);
                 }
            }

            // Construct the result object including new metadata fields
            results.push({
                id: match.id,
                score: match.score ?? 0, // Use score if available, default to 0
                content: metadata.content, // The text chunk
                metadata: {
                    fileName: metadata.fileName,
                    chunkIndex: chunkIndex, // Parsed number
                    pageNumber: pageNumber, // Parsed number or undefined
                    // Add the new fields from Pinecone metadata
                    docTitle: metadata.docTitle,
                    docSource: metadata.docSource,
                    docType: metadata.docType,
                    uploadedAt: metadata.uploadedAt,
                },
            });
        }
    }
    console.log(`Formatted ${results.length} valid search results.`);
    return results;

  } catch (error) {
    console.error('Error querying vectors:', error);
    throw error; // Re-throw for handling upstream
  }
};


// --- Export Client Object ---
// (Optional: Export the whole client if needed elsewhere)
const pineconeClient = {
  insertVectors,
  querySimilarChunks,
  getIndex,
};

export default pineconeClient; // Or export individual functions as needed