// app/api/admin/upload-document/route.ts - simplified version that avoids filesystem writes
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateEmbeddings } from '@/app/lib/embeddings';
import { insertVectors } from '@/app/lib/pinecone-client';
import { FileChunk } from '@/app/types';

interface UploadMetadata {
    title: string;
    source: string;
    type: string;
}

export async function POST(req: Request) {
  console.log('--- /api/admin/upload-document endpoint hit ---');
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const metadataString = formData.get('metadata') as string | null;

    // Validation logic remains the same
    if (!file || !(file instanceof File) || !metadataString) {
      return NextResponse.json(
        { error: 'Invalid file or missing metadata' },
        { status: 400 }
      );
    }
    
    let parsedMetadata: UploadMetadata;
    try {
      parsedMetadata = JSON.parse(metadataString) as UploadMetadata;
      if (!parsedMetadata.title) {
        return NextResponse.json({ error: 'Metadata is missing required "title" field' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid metadata format. Must be valid JSON.' }, { status: 400 });
    }

    const fileId = nanoid(10);
    const originalFileName = file.name;
    console.log(`Processing file: ${originalFileName} (size: ${file.size} bytes) with ID: ${fileId}`);

    // Extract text directly from buffer, without writing to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let fileContent = '';
    const fileExt = file.name.toLowerCase().split('.').pop() || '';
    
    if (fileExt === 'txt' || fileExt === 'md') {
      fileContent = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: `Unsupported file type: .${fileExt}` }, { status: 400 });
    }

    if (!fileContent) {
      return NextResponse.json({ error: 'Empty file content' }, { status: 400 });
    }

    // Split content into chunks
    const chunkSize = 1000;
    const overlap = 200;
    const fileChunks: FileChunk[] = [];
    
    for (let i = 0; i < fileContent.length; i += (chunkSize - overlap)) {
      const chunkEnd = Math.min(i + chunkSize, fileContent.length);
      const chunkContent = fileContent.slice(i, chunkEnd).trim();
      if (chunkContent) {
        fileChunks.push({
          id: `${fileId}-chunk-${fileChunks.length}`,
          fileId: fileId,
          content: chunkContent,
          metadata: {
            fileName: originalFileName,
            chunkIndex: fileChunks.length,
            pageNumber: undefined,
          },
        });
      }
    }

    if (fileChunks.length === 0) {
      return NextResponse.json({ error: 'No chunks could be generated from file' }, { status: 400 });
    }

    // Generate embeddings and store in Pinecone
    const vectors = await generateEmbeddings(fileChunks);
    if (!vectors || vectors.length === 0) {
      return NextResponse.json({ error: 'Failed to generate embeddings' }, { status: 500 });
    }
    
    await insertVectors(vectors);

    return NextResponse.json({
      success: true,
      message: `Document "${parsedMetadata.title}" (${originalFileName}) processed successfully with ${fileChunks.length} chunks.`,
      fileName: originalFileName,
      chunks: fileChunks.length,
    });

  } catch (error: unknown) {
    console.error('--- ERROR in /api/admin/upload-document ---:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json(
      { error: 'Failed to process document upload due to a server error.', details: errorMessage },
      { status: 500 }
    );
  }
}