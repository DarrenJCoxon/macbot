// app/lib/pinecone-client.ts
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { VectorSearchResult } from '@/app/types';

// Ensure environment variables are set
const pineconeApiKey = process.env.PINECONE_API_KEY || '';
const pineconeIndex = process.env.PINECONE_INDEX || 'macbot-docs';

if (!pineconeApiKey) {
  console.error('Missing Pinecone API key');
}

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: pineconeApiKey,
});

// Get or create index
export const getIndex = async () => {
  try {
    // Check if index exists
    const indexes = await pinecone.listIndexes();
    
    const indexExists = indexes.some(index => index.name === pineconeIndex);
    
    if (!indexExists) {
      // Create index if it doesn't exist
      await pinecone.createIndex({
        name: pineconeIndex,
        dimension: 1536, // Appropriate for most embedding models
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2'
          },
          metric: 'cosine'
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
  vectors: PineconeRecord<{ 
    fileName: string; 
    pageNumber?: number;
    chunkIndex: number;
    content: string;
  }>[]
) => {
  try {
    const index = await getIndex();
    
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
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
        pageNumber: match.metadata?.pageNumber as number | undefined,
        chunkIndex: match.metadata?.chunkIndex as number,
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