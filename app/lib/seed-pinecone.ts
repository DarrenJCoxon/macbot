import { getMacbethSeedData } from './seed-data';
import { storeDocuments } from './embedding-utils';

/**
 * Seeds the Pinecone vector database with Macbeth data
 */
export async function seedPinecone() {
  console.log('Starting to seed Pinecone with Macbeth data...');
  
  try {
    const macbethData = getMacbethSeedData();
    console.log(`Retrieved ${macbethData.length} documents to seed`);
    
    await storeDocuments(macbethData);
    
    console.log('Successfully seeded Pinecone with Macbeth data');
    return { success: true, count: macbethData.length };
  } catch (error) {
    console.error('Failed to seed Pinecone:', error);
    return { success: false, error };
  }
}

// If this file is executed directly (not imported)
if (require.main === module) {
  (async () => {
    try {
      const result = await seedPinecone();
      console.log('Seeding result:', result);
      process.exit(0);
    } catch (error) {
      console.error('Error in seeding script:', error);
      process.exit(1);
    }
  })();
}