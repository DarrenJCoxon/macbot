// app/lib/pinecone-client.ts
import {
  Pinecone,
  PineconeRecord,
  // Consider importing specific error types if available in your SDK version
  // (e.g., PineconeNotFoundError, PineconeConflictError) for more reliable checks.
} from '@pinecone-database/pinecone';
import { VectorSearchResult } from '@/app/types'; // Your application's search result type

// --- Environment Variables ---
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX; // Ensure this matches .env.local

// Basic check for environment variables
if (!pineconeApiKey) {
  console.error('ERROR: Missing Pinecone API key. Please set PINECONE_API_KEY environment variable.');
  // Consider throwing error in production
}
if (!pineconeIndexName) {
  console.error('ERROR: Missing Pinecone index name. Please set PINECONE_INDEX environment variable.');
  // Consider throwing error in production
}

// --- Metadata Type Definition for Pinecone Storage ---
// This defines how metadata should be structured when STORED in Pinecone.
export type PineconeDocumentMetadata = {
  fileName: string;
  pageNumber?: string; // Store as string | undefined
  chunkIndex: string; // Store as string
  content: string;
  uploadedAt?: string; // Optional: Timestamp as ISO string
};

// --- Initialize Pinecone Client ---
const pinecone = new Pinecone({
  apiKey: pineconeApiKey || 'MISSING_API_KEY', // Fallback or ensure checks throw
});

// --- Get or Create Index Function ---
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
    if (typeof error === 'object' && error !== null) {
      if ('status' in error && (error as { status: number }).status === 404) {
          isNotFoundError = true;
          console.log(`describeIndex error identified as 404 Not Found via status code.`);
      } else if ('name' in error && (error as { name: string }).name === 'PineconeNotFoundError') {
          isNotFoundError = true;
          console.log(`describeIndex error identified as PineconeNotFoundError via name.`);
      }
    }
    if (!isNotFoundError && error instanceof Error) {
        const errorMsgLower = error.message.toLowerCase();
        if (errorMsgLower.includes('not found') && (errorMsgLower.includes('index') || errorMsgLower.includes(pineconeIndexName.toLowerCase()))) {
            isNotFoundError = true;
            console.log(`describeIndex error identified as 'not found' via message content.`);
        }
    }
    if (!isNotFoundError && !(error instanceof Error && (error.message.includes('404') || error.message.includes('not found')))) {
         console.log("describeIndex failed with an error that doesn't appear to be a 'Not Found' error:", error);
    }

    // 3. If not found, create it
    if (isNotFoundError) {
      console.log(`Index '${pineconeIndexName}' not found. Attempting creation...`);
      try {
        await pinecone.createIndex({
          name: pineconeIndexName,
          // === UPDATED DIMENSION BACK TO 768 ===
          dimension: 768, // Set to match OpenAI text-embedding-3-small dimension parameter
          // ====================================
          metric: 'cosine',
          spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        });
        console.log(`Index '${pineconeIndexName}' creation initiated with dimension 768. Waiting ~60s...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
        console.log(`Index '${pineconeIndexName}' assumed ready.`);
        return pinecone.index<PineconeDocumentMetadata>(pineconeIndexName);
      } catch (creationError: unknown) {
        // 4. Handle creation errors (like 409 Conflict)
        console.error(`Failed to create index '${pineconeIndexName}':`, creationError);
        let isConflictError = false;
         if (creationError instanceof Error) {
             isConflictError = creationError.message.includes('409') || creationError.message.includes('ALREADY_EXISTS');
         } else if (typeof creationError === 'object' && creationError !== null && 'status' in creationError && (creationError as { status: number }).status === 409) {
             isConflictError = true;
         }
         if (isConflictError) {
             console.warn(`Index creation 409 Conflict. Assuming index exists.`);
             return pinecone.index<PineconeDocumentMetadata>(pineconeIndexName);
         }
        throw creationError;
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
    return true;
  }
  try {
    const index = await getIndex();
    console.log(`Inserting ${vectors.length} vectors into index '${pineconeIndexName}'`);
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      console.log(`Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)} (size: ${batch.length})`);
      await index.upsert(batch);
    }
    console.log(`Successfully inserted ${vectors.length} vectors.`);
    return true;
  } catch (error) {
    console.error('Error inserting vectors:', error);
    throw error;
  }
};


// --- Query Vectors Function ---
// Fetches similar chunks and formats the result
export const querySimilarChunks = async (
  queryEmbedding: number[],
  topK: number = 5
): Promise<VectorSearchResult[]> => {
  if (!pineconeIndexName) throw new Error("Pinecone index name is not configured.");
  if (!queryEmbedding || queryEmbedding.length === 0) { console.error("Empty query embedding."); return []; }

  // === UPDATED DIMENSION CHECK BACK TO 768 ===
  if (queryEmbedding.length !== 768) {
       console.error(`Query embedding dimension mismatch. Expected 768, got ${queryEmbedding.length}.`);
       return [];
  }
  // =========================================

  try {
    const index = await getIndex();
    console.log(`Querying index '${pineconeIndexName}' with topK=${topK}.`);

    const queryOptions: Parameters<typeof index.query>[0] = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
    };

    const queryResponse = await index.query(queryOptions);
    console.log(`Query returned ${queryResponse.matches?.length ?? 0} matches.`);

    // Map results
    const results: VectorSearchResult[] = [];
    if (queryResponse.matches) {
        for (const match of queryResponse.matches) {
            const metadata = match.metadata as PineconeDocumentMetadata | undefined;
            if (!metadata || typeof metadata.content !== 'string' || typeof metadata.fileName !== 'string' || typeof metadata.chunkIndex !== 'string') { continue; }
            const pageNumStr = metadata.pageNumber;
            const chunkIdxStr = metadata.chunkIndex;
            const chunkIndex = parseInt(chunkIdxStr, 10);
            if (isNaN(chunkIndex)) { continue; }
            let pageNumber: number | undefined = undefined;
            if (typeof pageNumStr === 'string') {
                 const parsedPage = parseInt(pageNumStr, 10);
                 if (!isNaN(parsedPage)) pageNumber = parsedPage;
                 else console.warn(`Match ${match.id}: Could not parse pageNumber '${pageNumStr}'.`);
            }
            results.push({
                id: match.id,
                score: match.score ?? 0,
                content: metadata.content,
                metadata: {
                    fileName: metadata.fileName,
                    pageNumber: pageNumber,
                    chunkIndex: chunkIndex,
                },
            });
        }
    }
    return results;

  } catch (error) {
    console.error('Error querying vectors:', error);
    throw error;
  }
};


// --- Export Client Object ---
const pineconeClient = {
  insertVectors,
  querySimilarChunks,
  getIndex,
};

export default pineconeClient;