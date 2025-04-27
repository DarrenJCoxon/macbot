import { NextResponse } from 'next/server';
import { index } from '@/app/lib/pinecone-client';

// Mark as Node.js runtime since we're working with Pinecone
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Query for documents with metadata filtering
    const result = await index.query({
      vector: Array(768).fill(0), // Query with a zero vector matching the dimensions of m2-bert-80M-8k-retrieval
      topK: 1000, // Get as many as possible
      includeMetadata: true,
      filter: {
        chunkIndex: 0, // Only get the first chunk to avoid duplicates
      },
    });
    
    // Group documents by title to get unique entries
    const documentMap = new Map();
    
    result.matches.forEach((match) => {
      const metadata = match.metadata || {};
      const title = metadata.title || 'Untitled';
      
      // Only add if not already in the map
      if (!documentMap.has(title)) {
        documentMap.set(title, {
          id: match.id,
          metadata: {
            title,
            source: metadata.source || 'Unknown',
            type: metadata.type || 'Unknown',
            totalChunks: metadata.totalChunks || 1,
            uploadDate: metadata.uploadDate,
            fileName: metadata.fileName,
          },
        });
      }
    });
    
    // Convert to array
    const documents = Array.from(documentMap.values());
    
    // Sort by upload date (newest first)
    documents.sort((a, b) => {
      const dateA = a.metadata.uploadDate ? new Date(a.metadata.uploadDate).getTime() : 0;
      const dateB = b.metadata.uploadDate ? new Date(b.metadata.uploadDate).getTime() : 0;
      return dateB - dateA;
    });
    
    return NextResponse.json({
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: String(error) },
      { status: 500 }
    );
  }
}