// app/lib/pinecone-client.ts
import {
  Pinecone,
  PineconeRecord,
  // --- Recommended: Import specific error types if available in your SDK version ---
  // You might find types like PineconeNotFoundError, PineconeConflictError etc.
  // Check the @pinecone-database/pinecone package's exports or documentation.
  // If available, use 'instanceof PineconeNotFoundError' etc. below for more reliable checks.
} from '@pinecone-database/pinecone';
import { VectorSearchResult } from '@/app/types'; // Your application's search result type

// --- Environment Variables ---
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX; // Ensure this matches .env.local

// Basic check for environment variables
if (!pineconeApiKey) {
  console.error('ERROR: Missing Pinecone API key. Please set PINECONE_API_KEY environment variable.');
  // Consider throwing an error here to prevent startup in production
  // throw new Error('Missing Pinecone API key.');
}
if (!pineconeIndexName) {
  console.error('ERROR: Missing Pinecone index name. Please set PINECONE_INDEX environment variable.');
  // Consider throwing an error here to prevent startup in production
  // throw new Error('Missing Pinecone index name.');
}

// --- Metadata Type Definition for Pinecone Storage ---
// This defines how metadata should be structured when STORED in Pinecone.
export type PineconeDocumentMetadata = {
  fileName: string;
  pageNumber?: string; // Store as string | undefined
  chunkIndex: string; // Store as string (assuming every chunk has an index)
  content: string; // The actual text content of the chunk
  uploadedAt?: string; // Optional: Timestamp as ISO string
};

// --- Initialize Pinecone Client ---
const pinecone = new Pinecone({
  apiKey: pineconeApiKey || 'MISSING_API_KEY', // Provide fallback or ensure checks above throw
});

// --- Get or Create Index Function ---
// Ensures the index exists and is ready before returning a handle to it.
export const getIndex = async () => {
  // Ensure index name is available before proceeding
  if (!pineconeIndexName) {
    throw new Error("Pinecone index name is not configured.");
  }

  console.log(`Attempting to get or create Pinecone index: ${pineconeIndexName}`);
  try {
    // 1. Try to describe the index to check if it exists and is ready
    await pinecone.describeIndex(pineconeIndexName);
    console.log(`Index '${pineconeIndexName}' found.`);
    // If describeIndex succeeds, the index exists. Return the index handle.
    return pinecone.index<PineconeDocumentMetadata>(pineconeIndexName);

  } catch (error: unknown) { // Catch errors from describeIndex
    // 2. Check if the error specifically indicates the index was not found
    let isNotFoundError = false;

    // Check 1: Check for specific error properties (more reliable)
    if (typeof error === 'object' && error !== null) {
        // Check if error object has a 'status' property equal to 404
        if ('status' in error && (error as { status: number }).status === 404) {
            isNotFoundError = true;
            console.log(`describeIndex error identified as 404 Not Found via status code.`);
        }
        // Check if error object has a 'name' property identifying it (adjust if SDK uses a different name)
        else if ('name' in error && (error as { name: string }).name === 'PineconeNotFoundError') {
             isNotFoundError = true;
             console.log(`describeIndex error identified as PineconeNotFoundError via name.`);
        }
        // Add checks for other potential SDK-specific error structures if needed
    }

    // Check 2: Fallback to message check if status/name checks failed (less reliable)
    if (!isNotFoundError && error instanceof Error) {
        const errorMsgLower = error.message.toLowerCase();
        // Refine message check - Pinecone 404 messages might vary slightly
        if (errorMsgLower.includes('not found') && (errorMsgLower.includes('index') || errorMsgLower.includes(pineconeIndexName.toLowerCase()))) {
            isNotFoundError = true;
            console.log(`describeIndex error identified as 'not found' via message content.`);
        }
    }

    // If none of the specific checks matched, log the raw error for debugging
    if (!isNotFoundError && !(error instanceof Error && (error.message.includes('404') || error.message.includes('not found')))) {
         console.log("describeIndex failed with an error that doesn't appear to be a 'Not Found' error:", error);
    }


    if (isNotFoundError) {
      // 3. Index not found error identified, proceed to create it
      console.log(`Index '${pineconeIndexName}' not found. Attempting creation...`);
      try {
        await pinecone.createIndex({
          name: pineconeIndexName,
          dimension: 768, // IMPORTANT: Ensure this matches your embedding model (m2-bert is 768d)
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1' // Ensure this is a valid and supported region
            }
          },
          // Optional: Add waitUntilReady if needed
          // waitUntilReady: true,
          // timeout: 180000
        });
        console.log(`Index '${pineconeIndexName}' creation initiated with dimension 768. Waiting ~60 seconds...`);
        // Simple wait. Consider increasing if index readiness takes longer.
        await new Promise(resolve => setTimeout(resolve, 60000));
        console.log(`Index '${pineconeIndexName}' assumed ready.`);
        // Return the handle for the newly created index
        return pinecone.index<PineconeDocumentMetadata>(pineconeIndexName);

      } catch (creationError: unknown) {
        // 4. Handle potential errors during the creation attempt itself
        console.error(`Failed to create index '${pineconeIndexName}':`, creationError);

        // Check specifically for a 409 conflict during create (race condition)
        let isConflictError = false;
         if (creationError instanceof Error) {
             // Use instanceof PineconeConflictError if available
             isConflictError = creationError.message.includes('409') || creationError.message.includes('ALREADY_EXISTS');
         } else if (typeof creationError === 'object' && creationError !== null && 'status' in creationError && (creationError as { status: number }).status === 409) {
             isConflictError = true;
         }

         if (isConflictError) {
             console.warn(`Index creation failed with 409 Conflict. Assuming index '${pineconeIndexName}' exists now and returning handle.`);
             return pinecone.index<PineconeDocumentMetadata>(pineconeIndexName); // Attempt to return handle anyway
         }

        throw creationError; // Re-throw other unexpected creation errors
      }
    } else {
      // 5. The error from describeIndex was *not* identified as a 'not found' error.
      console.error(`An unexpected error occurred when describing index '${pineconeIndexName}', and it was not identified as 'Not Found':`, error);
      throw error; // Re-throw unexpected errors (e.g., auth failure, network issue)
    }
  }
};


// --- Insert Vectors Function ---
// Expects vectors where metadata matches PineconeDocumentMetadata (strings for pageNumber/chunkIndex).
export const insertVectors = async (
  vectors: PineconeRecord<PineconeDocumentMetadata>[]
) => {
  if (!pineconeIndexName) {
    throw new Error("Pinecone index name is not configured for insertVectors.");
  }
  if (!vectors || vectors.length === 0) {
    console.warn("insertVectors called with no vectors. Skipping.");
    return true;
  }

  try {
    const index = await getIndex(); // Uses the robust getIndex logic above
    console.log(`Inserting ${vectors.length} vectors into index '${pineconeIndexName}'`);

    // Assumes input 'vectors' have metadata correctly formatted by the caller (e.g., generateEmbeddings)

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      console.log(`Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)} (size: ${batch.length})`);
      await index.upsert(batch); // Upsert the batch
    }
    console.log(`Successfully inserted ${vectors.length} vectors.`);
    return true;
  } catch (error) {
    console.error('Error inserting vectors:', error);
    throw error; // Re-throw error after logging
  }
};


// --- Query Vectors Function ---
// Fetches similar chunks and formats the result according to the application's VectorSearchResult type.
export const querySimilarChunks = async (
  queryEmbedding: number[],
  topK: number = 5
): Promise<VectorSearchResult[]> => {
  if (!pineconeIndexName) {
    throw new Error("Pinecone index name is not configured for querySimilarChunks.");
  }
  if (!queryEmbedding || queryEmbedding.length === 0) {
    console.error("querySimilarChunks called with empty or invalid query embedding.");
    return [];
  }
  // Add dimension check for the query vector before sending
  if (queryEmbedding.length !== 768) { // Ensure this matches the expected index dimension
       console.error(`Query embedding dimension mismatch. Expected 768, got ${queryEmbedding.length}.`);
       // Return empty or throw error, depending on desired behavior
       return [];
  }


  try {
    const index = await getIndex(); // Get the index handle
    console.log(`Querying index '${pineconeIndexName}' with topK=${topK}`);

    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true, // MUST be true to get metadata back
    });
    console.log(`Query returned ${queryResponse.matches?.length ?? 0} matches.`);

    // Map results and parse metadata back to application types (VectorSearchResult)
    const results: VectorSearchResult[] = [];
    if (queryResponse.matches) {
        for (const match of queryResponse.matches) {
            const metadata = match.metadata as PineconeDocumentMetadata | undefined;

            // Validate essential metadata existence
            if (!metadata || typeof metadata.content !== 'string' || typeof metadata.fileName !== 'string' || typeof metadata.chunkIndex !== 'string') {
                console.warn(`Skipping match ${match.id} due to missing or invalid essential metadata. Received:`, metadata);
                continue;
            }

            const pageNumStr = metadata.pageNumber;
            const chunkIdxStr = metadata.chunkIndex;

            // Safely parse chunkIndex string to number
            const chunkIndex = parseInt(chunkIdxStr, 10);
            if (isNaN(chunkIndex)) {
                console.warn(`Skipping match ${match.id} due to invalid chunkIndex metadata: '${chunkIdxStr}'`);
                continue;
            }

            // Safely parse pageNumber string to number | undefined
            let pageNumber: number | undefined = undefined;
            if (typeof pageNumStr === 'string') {
                const parsedPage = parseInt(pageNumStr, 10);
                if (!isNaN(parsedPage)) {
                    pageNumber = parsedPage;
                } else {
                    console.warn(`Match ${match.id}: Could not parse pageNumber string '${pageNumStr}' into a number.`);
                }
            }

            // Construct the result object according to VectorSearchResult type
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
    throw error; // Re-throw error after logging
  }
};


// --- Export Client Object (Optional but common pattern) ---
const pineconeClient = {
  insertVectors,
  querySimilarChunks,
  getIndex,
};

export default pineconeClient;