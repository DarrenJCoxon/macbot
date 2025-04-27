import { NextResponse } from 'next/server';
import { storeDocuments } from '@/app/lib/embedding-utils';
import { splitTextIntoChunks, createVectorDocuments } from '@/app/lib/document-utils';
import path from 'path';

// Mark this as Node.js runtime (not Edge) since we need to process files
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Extract the FormData
    const formData = await request.formData();
    
    // Get the file
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const fileExt = path.extname(file.name).toLowerCase();
    const allowedExtensions = ['.txt'];
    
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileExt}. Please upload .txt files.` },
        { status: 400 }
      );
    }
    
    // Get metadata
    const metadataStr = formData.get('metadata') as string | null;
    let metadata = {
      title: 'Untitled Document',
      source: 'User Upload',
      type: 'notes',
    };
    
    if (metadataStr) {
      try {
        metadata = {
          ...metadata,
          ...JSON.parse(metadataStr),
        };
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }
    
    // Read the file content
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Empty file content' },
        { status: 400 }
      );
    }
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(text);
    
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No valid content found in file' },
        { status: 400 }
      );
    }
    
    // Add file metadata
    const enhancedMetadata = {
      ...metadata,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || fileExt,
      uploadDate: new Date().toISOString(),
    };
    
    // Create vector documents
    const documents = createVectorDocuments(chunks, enhancedMetadata);
    
    // Store in vector database
    await storeDocuments(documents);
    
    return NextResponse.json({
      message: `Successfully processed and stored ${chunks.length} document chunks`,
      documentTitle: metadata.title,
      chunks: chunks.length,
    });
  } catch (error) {
    console.error('Error processing document upload:', error);
    return NextResponse.json(
      { error: 'Failed to process document', details: String(error) },
      { status: 500 }
    );
  }
}