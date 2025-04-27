// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import pineconeClient from '@/app/lib/pinecone-client';
import { getIndex } from '@/app/lib/pinecone-client';

export async function GET(req: Request) {
  try {
    // Get the URL params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Get Pinecone index
    const index = await getIndex();
    
    // Fetch document metadata
    const response = await index.fetch({ 
      ids: [], 
      limit 
    });
    
    // Extract document information from vectors
    const documents = Object.entries(response.vectors || {}).map(([id, vector]) => ({
      id,
      fileName: vector.metadata?.fileName,
      uploadedAt: vector.metadata?.uploadedAt,
    }));
    
    // Group documents by file name
    const groupedDocuments: Record<string, { 
      fileName: string; 
      uploadedAt?: string;
      chunks: number;
    }> = {};
    
    documents.forEach(doc => {
      if (doc.fileName) {
        if (!groupedDocuments[doc.fileName]) {
          groupedDocuments[doc.fileName] = {
            fileName: doc.fileName,
            uploadedAt: doc.uploadedAt as string | undefined,
            chunks: 0
          };
        }
        groupedDocuments[doc.fileName].chunks++;
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
    
    // Query vectors by fileName to get IDs
    const queryResponse = await index.query({
      filter: {
        fileName: { $eq: fileName }
      },
      topK: 1000,
      includeMetadata: false,
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