// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import { getIndex, PineconeDocumentMetadata } from '@/app/lib/pinecone-client'; // Added PineconeDocumentMetadata

export async function GET(req: Request) {
  console.log('--- GET /api/admin/documents ---'); // Add logging
  try {
    // Get the URL params (optional, maybe remove limit from client?)
    const url = new URL(req.url);
    // Increase limit significantly for better sampling, or fetch all if feasible (often not)
    const fetchLimit = parseInt(url.searchParams.get('limit') || '1000'); // Fetch more vectors

    // Get Pinecone index
    const index = await getIndex();

    // Get index stats to determine dimension
    const stats = await index.describeIndexStats();

    // Handle case where index might be empty or stats unavailable
    if (!stats.dimension || stats.totalRecordCount === 0) {
        console.log('Index is empty or dimension unknown.');
        return NextResponse.json({ documents: [] });
    }

    // Create a dummy vector query to fetch documents
    const dummyVector = Array(stats.dimension).fill(0);

    console.log(`Querying index for up to ${fetchLimit} vectors to list unique filenames...`);
    // Fetch document metadata using a query
    const response = await index.query({
      vector: dummyVector,
      topK: fetchLimit,
      includeMetadata: true
    });

    // Group documents by file name
    const groupedDocuments: Record<string, {
      fileName: string;
      uploadedAt?: string;
      chunks: number;
    }> = {};

    if (response.matches) {
        console.log(`Processing metadata from ${response.matches.length} vectors...`);
        response.matches.forEach(match => {
          // Use the specific metadata type
          const metadata = match.metadata as PineconeDocumentMetadata | undefined;
          const fileName = metadata?.fileName;

          if (fileName) {
            if (!groupedDocuments[fileName]) {
              groupedDocuments[fileName] = {
                fileName: fileName,
                uploadedAt: metadata?.uploadedAt, // Get first encountered upload time
                chunks: 0
              };
            }
            // Increment chunk count for this file
            groupedDocuments[fileName].chunks++;
          }
        });
    }

    const uniqueDocuments = Object.values(groupedDocuments);
    console.log(`Found ${uniqueDocuments.length} unique document filenames.`);

    return NextResponse.json({
      documents: uniqueDocuments
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  console.log('--- DELETE /api/admin/documents ---'); // Add logging
  try {
    // Get the request body
    const { fileName } = await req.json();

    // Add type check for fileName
    if (!fileName || typeof fileName !== 'string') {
      console.error("DELETE request missing valid 'fileName'.");
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }
    console.log(`Attempting to delete vectors for fileName: ${fileName}`);

    // Get Pinecone index
    const index = await getIndex();

    // Get index dimension for query
    const stats = await index.describeIndexStats();

    // Handle case where index might be empty or dimension unknown
    if (!stats.dimension) {
        throw new Error("Index dimension unknown, cannot query to delete.");
    }

    const dummyVector = Array(stats.dimension).fill(0);

    console.log(`Querying for vector IDs matching fileName: ${fileName}...`);
    const queryLimit = 10000; // Set high enough to likely get all chunks

    // Query vectors by fileName to get IDs
    const queryResponse = await index.query({
      vector: dummyVector,
      topK: queryLimit, // Increased limit
      includeMetadata: false, // Don't need metadata
      includeValues: false, // Don't need vectors
      filter: {
        fileName: { $eq: fileName }
      }
    });

    // Get IDs to delete
    const idsToDelete = queryResponse.matches.map(match => match.id);

    if (idsToDelete.length > 0) {
      // Delete vectors in batches
      console.log(`Found ${idsToDelete.length} vector IDs to delete. Deleting in batches...`);
      const batchSize = 1000; // Max batch size for deleteMany
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        console.log(`Deleting batch ${Math.floor(i/batchSize) + 1} (size: ${batch.length})`);
        await index.deleteMany(batch);
      }
      console.log(`Deletion request completed for ${idsToDelete.length} vectors.`);
    } else {
       console.log(`No vectors found matching fileName: ${fileName}. Nothing to delete.`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed deletion request for ${fileName}. Deleted ${idsToDelete.length} vector chunks.`, // More informative message
      deletedCount: idsToDelete.length,
      fileName
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Failed to delete document', details: message },
      { status: 500 }
    );
  }
}