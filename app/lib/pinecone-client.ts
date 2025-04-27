import { Pinecone } from '@pinecone-database/pinecone';

// Check if the API key and environment are defined
const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX_NAME || 'macbeth-index';

if (!apiKey) {
  console.error("Missing PINECONE_API_KEY environment variable");
}

// Initialize the Pinecone client
const pinecone = new Pinecone({
  apiKey: apiKey || "",
});

// Get the index - this will be used for queries and upserts
export const index = pinecone.index(indexName);

export default pinecone;