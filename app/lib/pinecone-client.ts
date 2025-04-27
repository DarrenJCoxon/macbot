// app/lib/pinecone-client.ts
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { VectorSearchResult } from '@/app/types';

// Ensure environment variables are set
const pineconeApiKey = process.env.PINECONE_API_KEY || '';
const pineconeIndex = process.env.PINECONE_INDEX || 'macbot-docs';

if (!pineconeApiKey) {
  console.error('Missing Pinecone API key');
}

// Define metadata type with proper typing
type DocumentMetadata = {
  fileName: string;
  pageNumber?: string; // Changed to string for Pinecone compatibility
  chunkIndex: string; // Changed to string for Pinecone compatibility
  content: string;
  uploadedAt?: string;
};

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: pineconeApiKey,
});

// Get or create index
export const getIndex = async () => {
  try {
    // Check if index exists
    const indexes = await pinecone.listIndexes();
    
    // Fix: Array.some() doesn't exist on IndexList type
    let indexExists = false;
    for (const idx of Object.values(indexes)) {
      if (idx.name === pineconeIndex) {
        indexExists = true;
        break;
      }
    }
    
    if (!indexExists) {
      // Create index if it doesn't exist
      await pinecone.createIndex({
        name: pineconeIndex,
        dimension: 1536, // Appropriate for most embedding models
        metric: 'cosine', // Moved from spec object to main options
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2'
          }
        }
      });
      
      // Wait for index to be ready
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
    
    return pinecone.index(pineconeIndex);
  } catch (error) {
    console.error('Error initializing Pinecone index:', error);
    throw error;
  }
};

// Insert vectors into Pinecone
export const insertVectors = async (
  vectors: PineconeRecord<DocumentMetadata>[]
) => {
  try {
    const index = await getIndex();
    
    // Convert number values to strings for Pinecone compatibility
    const processedVectors = vectors.map(vector => ({
      ...vector,
      metadata: {
        ...vector.metadata,
        // Convert number to string for compatibility if it exists
        pageNumber: vector.metadata?.pageNumber?.toString() ?? '',
        chunkIndex: vector.metadata?.chunkIndex?.toString() ?? ''
      }
    }));
    
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < processedVectors.length; i += batchSize) {
      const batch = processedVectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
    
    return true;
  } catch (error) {
    console.error('Error inserting vectors:', error);
    throw error;
  }
};

// Query Pinecone for similar vectors
export const querySimilarChunks = async (
  queryEmbedding: number[],
  topK: number = 5
): Promise<VectorSearchResult[]> => {
  try {
    const index = await getIndex();
    
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });
    
    return queryResponse.matches.map(match => ({
      id: match.id,
      score: match.score || 0, // Provide default value if score is undefined
      content: match.metadata?.content as string,
      metadata: {
        fileName: match.metadata?.fileName as string,
        pageNumber: match.metadata?.pageNumber ? parseInt(match.metadata.pageNumber as string) : undefined,
        chunkIndex: parseInt(match.metadata?.chunkIndex as string),
      },
    }));
  } catch (error) {
    console.error('Error querying vectors:', error);
    throw error;
  }
};

// Create a client object to export
const pineconeClient = {
  insertVectors,
  querySimilarChunks,
  getIndex,
};

export default pineconeClient;