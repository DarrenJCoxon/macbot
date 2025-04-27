// app/lib/embedding-utils.ts
import togetherClient from "./together-client";
import { getIndex } from "./pinecone-client";

// Embedding model that outputs embeddings compatible with your Pinecone index
const EMBEDDING_MODEL = "togethercomputer/m2-bert-80M-8k-retrieval";

/**
 * Generate embeddings for text using Together.ai
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await togetherClient.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Interface for vector store document
 */
export interface VectorDocument {
  id: string;
  text: string;
  metadata?: {
    source?: string;
    act?: string;
    scene?: string;
    character?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Store document in Pinecone
 */
export async function storeDocument(doc: VectorDocument): Promise<void> {
  try {
    const embedding = await generateEmbedding(doc.text);
    const index = await getIndex();
    
    await index.upsert([{
      id: doc.id,
      values: embedding,
      metadata: {
        text: doc.text,
        ...doc.metadata,
      },
    }]);
    
    console.log(`Stored document: ${doc.id}`);
  } catch (error) {
    console.error(`Error storing document ${doc.id}:`, error);
    throw error;
  }
}

/**
 * Store multiple documents in Pinecone in batches
 */
export async function storeDocuments(docs: VectorDocument[]): Promise<void> {
  try {
    const batchSize = 10;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      
      // Process in parallel
      await Promise.all(batch.map(async (doc) => {
        try {
          await storeDocument(doc);
        } catch (error) {
          console.error(`Error storing document ${doc.id}:`, error);
          // Continue with other documents even if one fails
        }
      }));
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(docs.length / batchSize)}`);
    }
    
    console.log(`Finished processing ${docs.length} documents`);
  } catch (error) {
    console.error("Error storing documents:", error);
    throw error;
  }
}

/**
 * Query Pinecone for similar documents
 */
export async function querySimilarDocuments(query: string, limit: number = 5): Promise<VectorDocument[]> {
  try {
    const embedding = await generateEmbedding(query);
    const index = await getIndex();
    
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
    });
    
    return queryResponse.matches.map((match) => ({
      id: match.id,
      text: match.metadata?.text as string,
      metadata: {
        ...(match.metadata as Record<string, unknown>),
      },
    })) as VectorDocument[];
  } catch (error) {
    console.error("Error querying similar documents:", error);
    // Return empty array instead of throwing to gracefully handle failures
    return [];
  }
}

/**
 * Format retrieved context into a prompt-friendly format
 */
export function formatRetrievedContext(docs: VectorDocument[]): string {
  if (docs.length === 0) return "";
  
  const formattedDocs = docs.map(doc => {
    const source = doc.metadata?.source 
      ? `Source: ${doc.metadata.source}` 
      : "";
    
    const location = doc.metadata?.act && doc.metadata?.scene
      ? `Act ${doc.metadata.act}, Scene ${doc.metadata.scene}`
      : "";
      
    const character = doc.metadata?.character
      ? `Character: ${doc.metadata.character}`
      : "";
      
    const metadata = [source, location, character]
      .filter(item => item !== "")
      .join(" | ");
      
    return `${metadata ? `[${metadata}]\n` : ""}${doc.text}`;
  });
  
  return `
RELEVANT CONTEXT:
${formattedDocs.join("\n\n")}
`;
}