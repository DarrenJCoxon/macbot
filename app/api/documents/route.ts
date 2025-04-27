// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import { getIndex } from '@/app/lib/pinecone-client';

export async function GET(req: Request) {
  try {
    // Get the URL params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Get Pinecone index
    const index = await getIndex();
    
    // Get index stats to determine dimension
    const stats = await index.describeIndexStats();
    
    // Create a dummy vector query to fetch documents
    const dummyVector = Array(stats.dimension).fill(0);
    
    // Fetch document metadata using a query
    const response = await index.query({ 
      vector: dummyVector,
      topK: limit,
      includeMetadata: true
    });
    
    // Extract document information from matches
    const documents = response.matches.map(match => ({
      id: match.id,
      fileName: match.metadata?.fileName,
      uploadedAt: match.metadata?.uploadedAt,
    }));
    
    // Group documents by file name
    const groupedDocuments: Record<string, { 
      fileName: string; 
      uploadedAt?: string;
      chunks: number;
    }> = {};
    
    documents.forEach(doc => {
      if (doc.fileName) {
        const fileName = doc.fileName as string;
        if (!groupedDocuments[fileName]) {
          groupedDocuments[fileName] = {
            fileName: fileName,
            uploadedAt: doc.uploadedAt as string | undefined,
            chunks: 0
          };
        }
        groupedDocuments[fileName].chunks++;
      }
    });
    
    return NextResponse.json({
      documents: Object.values(groupedDocuments)
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // Get the request body
    const { fileName } = await req.json();
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }
    
    // Get Pinecone index
    const index = await getIndex();
    
    // Get index dimension for query
    const stats = await index.describeIndexStats();
    const dummyVector = Array(stats.dimension).fill(0);
    
    // Query vectors by fileName to get IDs
    const queryResponse = await index.query({
      vector: dummyVector,
      topK: 1000,
      includeMetadata: true,
      filter: {
        fileName: { $eq: fileName }
      }
    });
    
    // Get IDs to delete
    const idsToDelete = queryResponse.matches.map(match => match.id);
    
    if (idsToDelete.length > 0) {
      // Delete vectors in batches
      const batchSize = 100;
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        await index.deleteMany(batch);
      }
    }
    
    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      fileName
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}