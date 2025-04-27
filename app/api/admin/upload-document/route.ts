// app/api/admin/upload-document/route.ts
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';
import { generateEmbeddings } from '@/app/lib/embeddings'; // Use the SAME embedding generation
import { insertVectors } from '@/app/lib/pinecone-client'; // Use the SAME insertion logic
import { FileChunk } from '@/app/types'; // Use the SAME chunk type

// Define expected metadata structure from DocumentUploader
interface UploadMetadata {
    title: string;
    source: string;
    type: string;
}

// Ensure uploads directory exists (same as the other route)
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
  }
} catch (error) {
    console.error(`FATAL: Failed to create or access uploads directory: ${uploadsDir}`, error);
}

export async function POST(req: Request) {
  console.log('--- /api/admin/upload-document endpoint hit ---');
  try {
    const formData = await req.formData();

    // --- Get SINGLE file using key 'file' ---
    const file = formData.get('file') as File | null;
    // --- Get METADATA string using key 'metadata' ---
    const metadataString = formData.get('metadata') as string | null;

    // --- Validation ---
    if (!file) {
      console.log('Validation failed: No file found in formData for key "file".');
      return NextResponse.json({ error: 'No file uploaded under the key "file"' }, { status: 400 });
    }
    if (!(file instanceof File)) {
        console.log('Validation failed: "file" field is not a File object.');
        return NextResponse.json({ error: '"file" field is not a File object' }, { status: 400 });
    }
     if (!metadataString) {
      console.log('Validation failed: No metadata found in formData for key "metadata".');
      return NextResponse.json({ error: 'Missing required metadata field' }, { status: 400 });
    }
     let parsedMetadata: UploadMetadata;
     try {
        parsedMetadata = JSON.parse(metadataString) as UploadMetadata;
        if (!parsedMetadata.title) {
             return NextResponse.json({ error: 'Metadata is missing required "title" field' }, { status: 400 });
        }
     } catch (e) {
         console.log('Validation failed: Could not parse metadata JSON.', e);
         return NextResponse.json({ error: 'Invalid metadata format. Must be valid JSON.' }, { status: 400 });
     }
    // --- End Validation ---


    const fileId = nanoid(10);
    const originalFileName = file.name;
    console.log(`Processing file: ${originalFileName} (size: ${file.size} bytes) with ID: ${fileId}. Metadata:`, parsedMetadata);


    // --- Optional: Save raw file ---
    const tempFilePath = join(uploadsDir, `${fileId}-${originalFileName}`);
    console.log(`Attempting to write temporary file to: ${tempFilePath}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempFilePath, buffer);
    console.log(`Temporary file written successfully.`);


    // --- Extract Text (Same logic as other route, adapt as needed) ---
    let fileContent = '';
    const fileExt = path.extname(originalFileName).toLowerCase();
    console.log(`Extracting content for type: ${fileExt}`);
    if (fileExt === '.txt' || fileExt === '.md') { // Currently DocumentUploader only allows .txt
      fileContent = buffer.toString('utf-8');
    } else {
      // Add PDF/DOCX extraction here if DocumentUploader supports them later
      console.warn(`Unsupported file type '${fileExt}' received by admin route.`);
       // Clean up temp file before erroring
       try { if (fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath); } catch {}
       return NextResponse.json({ error: `Unsupported file type: ${fileExt}` }, { status: 400 });
    }
    console.log(`Content extracted (length: ${fileContent?.length || 0})`);


    // --- Split into Chunks (Same logic) ---
    if (!fileContent) {
        console.warn(`No content available for ${originalFileName}, skipping.`);
        try { if (fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath); } catch {}
        return NextResponse.json({ error: `No content could be extracted from file ${originalFileName}` }, { status: 400 });
    }
    const chunkSize = 1000;
    const overlap = 200;
    const fileChunks: FileChunk[] = [];
    console.log(`Splitting into chunks...`);
    for (let i = 0; i < fileContent.length; i += (chunkSize - overlap)) {
        const chunkEnd = Math.min(i + chunkSize, fileContent.length);
        const chunkContent = fileContent.slice(i, chunkEnd);
        if (chunkContent.trim()) {
            fileChunks.push({
                id: `${fileId}-chunk-${fileChunks.length}`,
                fileId: fileId,
                content: chunkContent,
                metadata: {
                    fileName: originalFileName, // Use original name
                    // Here you could potentially add the *parsedMetadata* fields
                    // title: parsedMetadata.title, source: parsedMetadata.source, etc.
                    // but FileChunk type doesn't have them. Adjust FileChunk or store differently if needed.
                    chunkIndex: fileChunks.length,
                    pageNumber: undefined,
                },
            });
        }
    }
    console.log(`Generated ${fileChunks.length} chunks.`);

    if (fileChunks.length === 0) {
        console.warn(`No chunks generated for ${originalFileName}.`);
        try { if (fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath); } catch {}
         return NextResponse.json({ error: `Could not generate processable chunks from file ${originalFileName}` }, { status: 400 });
    }

    // --- Generate Embeddings (Use the same function) ---
    // Note: generateEmbeddings expects FileChunk[], ensure mapping is correct if needed
    const vectors = await generateEmbeddings(fileChunks);

    // --- Upsert into Pinecone (Use the same function) ---
    if (vectors && vectors.length > 0) {
      await insertVectors(vectors);
    } else {
      console.warn(`No vectors generated for ${originalFileName}.`);
       try { if (fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath); } catch {}
       return NextResponse.json({ error: `Failed to generate embeddings for file ${originalFileName}` }, { status: 500 });
    }

    // --- Optional: Cleanup temp file ---
    try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
          console.log(`Cleaned up temporary file: ${tempFilePath}`);
        }
    } catch (cleanupError) {
        console.error(`Error cleaning up temporary file ${tempFilePath}:`, cleanupError);
    }

    console.log('--- /api/admin/upload-document processing successful ---');
    return NextResponse.json({
      success: true,
      message: `Document "${parsedMetadata.title}" (${originalFileName}) processed successfully with ${fileChunks.length} chunks.`,
      fileName: originalFileName,
      chunks: fileChunks.length,
      metadataReceived: parsedMetadata,
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