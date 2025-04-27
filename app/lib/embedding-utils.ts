// app/lib/embedding-utils.ts
import togetherClient from "./together-client";
// Import getIndex AND the specific metadata type definition from pinecone-client
import { getIndex, PineconeDocumentMetadata } from "./pinecone-client";
import { nanoid } from "nanoid"; // Assuming nanoid is used for seeding IDs

// Ensure the embedding model's dimension matches the Pinecone index dimension (e.g., 1536)
const EMBEDDING_MODEL = "togethercomputer/m2-bert-80M-8k-retrieval"; // Ensure compatibility

/**
 * Generate single embedding for a text string (used for queries)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text) {
    console.warn("generateEmbedding called with empty text.");
    // Returning a zero vector might lead to poor search results. Consider throwing an error instead.
    // throw new Error("Cannot generate embedding for empty text.");
    return Array(1024).fill(0); // Example: return zero vector matching dimension
  }
  try {
    console.log(`Generating embedding for query text (length: ${text.length}) using ${EMBEDDING_MODEL}...`);
    // Replace newlines as they can sometimes affect embedding quality
    const cleanedText = text.replace(/\n/g, " ");
    const response = await togetherClient.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanedText,
    });

    // Validate the response structure
    if (!response?.data?.[0]?.embedding) {
      throw new Error("Invalid response structure from Together.ai embedding API");
    }
    if (response.data[0].embedding.length !== 768) {
       console.warn(`Warning: Embedding dimension mismatch. Expected 1536, got ${response.data[0].embedding.length}. Ensure EMBEDDING_MODEL is correct.`);
       // Consider throwing an error if dimension mismatch is critical
    }

    console.log("Query embedding generated successfully.");
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating query embedding:", error);
    throw error; // Re-throw to be handled by the caller (e.g., chat route)
  }
}


// --- Seeding / Generic Document Interface ---
// Interface for documents before they are processed for Pinecone storage
export interface VectorDocument {
  id?: string; // Allow ID to be optional, generate if missing
  text: string; // The main content
  metadata?: {
    source?: string; // Example source identifier
    pageNumber?: number; // Number before conversion
    chunkIndex?: number; // Number before conversion
    // Allow other arbitrary key-value pairs
    [key: string]: string | number | boolean | undefined;
  };
}


/**
 * Store single document (like seed data) in Pinecone - CORRECTED
 * Converts VectorDocument to the format expected by Pinecone (PineconeDocumentMetadata).
 */
export async function storeDocument(doc: VectorDocument): Promise<void> {
  // Ensure doc has an ID, generate if missing
  const docId = doc.id || nanoid();
  if (!doc.text) {
      console.warn(`Skipping document ${docId} because its text content is empty.`);
      return;
  }

  try {
    // 1. Generate embedding for the document's text
    const embedding = await generateEmbedding(doc.text);

    // 2. Get Pinecone index handle (typed with PineconeDocumentMetadata)
    const index = await getIndex(); // Uses the robust getIndex from pinecone-client

    // 3. Prepare metadata according to PineconeDocumentMetadata structure
    const metadataForPinecone: PineconeDocumentMetadata = {
      // Required fields from PineconeDocumentMetadata:
      content: doc.text, // Store the main text under the 'content' key
      fileName: doc.metadata?.source || `doc_${docId}`, // Map 'source' to 'fileName', provide fallback
      chunkIndex: (typeof doc.metadata?.chunkIndex === 'number' ? doc.metadata.chunkIndex.toString() : "0"), // Convert number to string, default to "0" if missing/invalid

      // Optional fields from PineconeDocumentMetadata:
      pageNumber: doc.metadata?.pageNumber?.toString(), // Convert number? to string | undefined
      uploadedAt: new Date().toISOString(), // Add timestamp during storage

      // Note: If VectorDocument.metadata has other fields NOT defined in
      // PineconeDocumentMetadata, they won't be included here unless you explicitly add them.
      // Pinecone allows arbitrary metadata, but defining the type is safer.
      // Example: If you had `theme: 'xyz'` in doc.metadata, it wouldn't be stored
      // unless PineconeDocumentMetadata included `theme?: string;`
    };

    // 4. Upsert the record into Pinecone
    await index.upsert([{
      id: docId,
      values: embedding,
      metadata: metadataForPinecone, // Use the correctly formatted metadata object
    }]);

    console.log(`Stored document: ${docId}`);
  } catch (error) {
    console.error(`Error storing document ${docId}:`, error);
    throw error; // Re-throw error to be handled by the caller (like storeDocuments)
  }
}


/**
 * Store multiple documents in Pinecone in batches - CORRECTED
 * Calls the corrected storeDocument function for each document.
 */
export async function storeDocuments(docs: VectorDocument[]): Promise<void> {
  // Consider using the main `insertVectors` from pinecone-client for potentially better performance
  // by batching embedding generation and upserts, but this works by calling storeDocument individually.
  console.log(`Attempting to store ${docs.length} documents...`);
  const batchSize = 10; // Process in chunks for logging/potential parallelization
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(docs.length / batchSize)} (size: ${batch.length})`);

    // Process documents in the current batch, potentially in parallel
    const results = await Promise.allSettled(batch.map(doc => storeDocument(doc)));

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
        // Log the error for the specific document that failed in the batch
        console.error(`Error storing document (ID: ${batch[index].id || 'N/A'}, Text Start: ${batch[index].text?.substring(0, 30)}...):`, result.reason);
      }
    });
  }

  console.log(`Finished storing documents. Success: ${successCount}, Failed: ${failureCount}`);
  if (failureCount > 0) {
      // Optionally throw an error if any document failed
      // throw new Error(`${failureCount} documents failed to store.`);
  }
}


/**
 * Query Pinecone for similar documents - CORRECTED
 * Retrieves documents and maps them back to the VectorDocument format.
 */
export async function querySimilarDocuments(query: string, limit: number = 5): Promise<VectorDocument[]> {
  console.log(`Querying for documents similar to: "${query.substring(0, 50)}..." (limit: ${limit})`);
  if (!query) {
      console.warn("querySimilarDocuments called with empty query.");
      return [];
  }

  try {
    // 1. Generate embedding for the query
    const embedding = await generateEmbedding(query);

    // 2. Get Pinecone index handle (typed with PineconeDocumentMetadata)
    const index = await getIndex();

    // 3. Perform the query
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true, // Required to get metadata back
    });
    console.log(`Pinecone query returned ${queryResponse.matches?.length ?? 0} matches.`);

    // 4. Map results back to the VectorDocument format
    const results: VectorDocument[] = [];
    if (queryResponse.matches) {
      for (const match of queryResponse.matches) {
        // Assert the type of the retrieved metadata
        const metadataFromPinecone = match.metadata as PineconeDocumentMetadata | undefined;

        // Validate essential 'content' field retrieved from metadata
        if (!metadataFromPinecone || typeof metadataFromPinecone.content !== 'string') {
          console.warn(`Skipping match ${match.id} due to missing or invalid 'content' in metadata. Received:`, metadataFromPinecone);
          continue;
        }

        // Safely parse numbers back from strings
        const chunkIdxStr = metadataFromPinecone.chunkIndex; // Should be a string
        const pageNumStr = metadataFromPinecone.pageNumber; // String or undefined

        const chunkIndex = parseInt(chunkIdxStr, 10);
        let pageNumber: number | undefined = undefined;
        if (typeof pageNumStr === 'string') {
            const parsedPage = parseInt(pageNumStr, 10);
            if (!isNaN(parsedPage)) pageNumber = parsedPage;
        }

        // Check for parsing errors
        if (isNaN(chunkIndex)) {
            console.warn(`Match ${match.id}: Invalid chunkIndex found in metadata: '${chunkIdxStr}'. Skipping.`);
            continue;
        }

        // Reconstruct the VectorDocument
        const doc: VectorDocument = {
          id: match.id,
          text: metadataFromPinecone.content, // Assign 'content' back to 'text'
          metadata: {
            // Map known fields back
            source: metadataFromPinecone.fileName, // Map 'fileName' back to 'source'
            pageNumber: pageNumber,
            chunkIndex: chunkIndex,

            // Include other metadata fields if they exist and are needed, converting types if necessary
            // Example: If 'uploadedAt' was stored and needed:
            // uploadedAt: metadataFromPinecone.uploadedAt ? new Date(metadataFromPinecone.uploadedAt) : undefined,

            // Careful about spreading directly if keys conflict or types differ
            // ...(metadataFromPinecone)
          },
          // Optionally add score to the result if needed by the caller
          // score: match.score
        };
        results.push(doc);
      }
    }
    console.log(`Returning ${results.length} mapped VectorDocument results.`);
    return results;

  } catch (error) {
    console.error("Error querying similar documents:", error);
    // Return empty array on error to prevent crashing the caller (e.g., chat route)
    return [];
  }
}


/**
 * Format retrieved context into a prompt-friendly format - UNCHANGED
 * Uses the VectorDocument format returned by querySimilarDocuments.
 */
export function formatRetrievedContext(docs: VectorDocument[]): string {
  if (!docs || docs.length === 0) return "";

  const formattedDocs = docs.map(doc => {
    const source = doc.metadata?.source
      ? `Source: ${doc.metadata.source}`
      : "";

    // Access chunkIndex/pageNumber which should now be numbers
    const chunkInfo = `Chunk: ${doc.metadata?.chunkIndex ?? 'N/A'}`;
    const pageInfo = doc.metadata?.pageNumber !== undefined
      ? `Page: ${doc.metadata.pageNumber}`
      : "";

    // Example: Include act/scene if they exist in metadata
    const location = doc.metadata?.act && doc.metadata?.scene
      ? `Location: Act ${doc.metadata.act}, Scene ${doc.metadata.scene}`
      : "";

    const character = doc.metadata?.character
      ? `Character: ${doc.metadata.character}`
      : "";

    // Construct metadata string - adjust fields as needed
    const metadataString = [source, pageInfo, chunkInfo, location, character]
      .filter(item => item !== "") // Remove empty parts
      .join(" | ");

    // Return formatted string with metadata header and text content
    return `${metadataString ? `[${metadataString}]\n` : ""}${doc.text}`;
  });

  // Combine formatted documents into a single string for the prompt
  return `
--- Relevant Context Start ---
${formattedDocs.join("\n\n---\n\n")}
--- Relevant Context End ---
`;
}