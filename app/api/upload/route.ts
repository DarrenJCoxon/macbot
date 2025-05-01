// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import * as path from 'path'; // Keep for extname
import { nanoid } from 'nanoid';

// Import embedding generation and Pinecone client
import { generateEmbeddings } from '@/app/lib/embeddings';
import { insertVectors } from '@/app/lib/pinecone-client';
import { FileChunk } from '@/app/types';

export async function POST(req: Request) {
  console.log('--- /api/upload endpoint hit ---');
  try {
    console.log('Attempting to read formData...');
    const formData = await req.formData();
    console.log('FormData read successfully.');

    const filesKey = 'files';
    console.log(`Attempting to get files using key: '${filesKey}'...`);
    const files = formData.getAll(filesKey) as File[];
    console.log(`Received ${files?.length ?? 'undefined/null'} file(s) under key '${filesKey}'`);

    if (!files || files.length === 0) {
      console.log(`Validation failed: No files found in formData for key '${filesKey}'. Returning 400.`);
      return NextResponse.json(
        { error: `No files uploaded under the key '${filesKey}'` },
        { status: 400 }
      );
    }

    console.log(`Found ${files.length} file(s). Starting processing loop...`);
    const fileNames: string[] = [];
    const processedFilesInfo: Array<{ name: string; chunks: number }> = [];

    for (const file of files) {
      if (!(file instanceof File)) {
          console.warn("Received an item in formData that is not a File object, skipping:", file);
          continue;
      }

      const fileId = nanoid(10);
      const originalFileName = file.name;
      fileNames.push(originalFileName);
      console.log(`Processing file: ${originalFileName} (size: ${file.size} bytes) with ID: ${fileId}`);

      // --- Process Buffer Directly ---
      console.log(`Reading buffer for file: ${originalFileName}`);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`Buffer read successfully (size: ${buffer.length})`);

      // --- Extract Text (using the buffer directly) ---
      let fileContent = '';
      const fileExt = path.extname(originalFileName).toLowerCase();
      console.log(`Extracting content for type: ${fileExt}`);

      try {
        if (fileExt === '.txt' || fileExt === '.md') {
          fileContent = buffer.toString('utf-8');
        } else if (fileExt === '.pdf') {
          // Parse PDF using pdf-parse with proper typing
          try {
            const pdfParseModule = await import('pdf-parse');
            const pdfParse: (buffer: Buffer, options?: object) => Promise<{ text: string }> = pdfParseModule.default;
            const pdfData = await pdfParse(buffer, {});
            fileContent = pdfData.text;
            console.log(`Extracted ${fileContent.length} characters from PDF`);
          } catch (error) {
            console.error('PDF parsing error:', error);
            throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else if (fileExt === '.docx' || fileExt === '.doc') {
          // Parse DOCX using mammoth
          try {
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            fileContent = result.value;
            console.log(`Extracted ${fileContent.length} characters from Word document`);
          } catch (error) {
            console.error('DOCX parsing error:', error);
            throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          console.warn(`Unsupported file type '${fileExt}' for content extraction. Skipping content processing for ${originalFileName}.`);
          continue; // Skip this file if type is unsupported
        }
      } catch (error) {
        console.error(`Error parsing file ${originalFileName}:`, error);
        // Continue with next file on error
        continue;
      }
      
      console.log(`Content extracted (length: ${fileContent?.length || 0})`);

      // --- Split into Chunks ---
      if (!fileContent) {
          console.warn(`No content available for ${originalFileName}, skipping chunking and embedding.`);
          continue;
      }
      const chunkSize = 1000;
      const overlap = 200;
      const fileChunks: FileChunk[] = [];
      console.log(`Splitting into chunks (size: ${chunkSize}, overlap: ${overlap})...`);
      for (let i = 0; i < fileContent.length; i += (chunkSize - overlap)) {
        const chunkEnd = Math.min(i + chunkSize, fileContent.length);
        // Ensure chunkContent is derived correctly after removing intermediate variables
        const chunkContent = fileContent.slice(i, chunkEnd).trim();
        if (chunkContent) { // Only add non-empty chunks
            fileChunks.push({
              id: `${fileId}-chunk-${fileChunks.length}`,
              fileId: fileId,
              content: chunkContent, // Use the trimmed chunk content
              metadata: {
                fileName: originalFileName,
                chunkIndex: fileChunks.length,
                pageNumber: undefined,
              },
            });
        }
      }
      console.log(`Generated ${fileChunks.length} chunks.`);

      if (fileChunks.length === 0) {
          console.warn(`No chunks generated for ${originalFileName}, skipping embedding.`);
          continue;
      }

      // --- Generate Embeddings ---
      const vectors = await generateEmbeddings(fileChunks); // Assumes this returns the correct format

      // --- Upsert into Pinecone ---
      if (vectors && vectors.length > 0) {
        await insertVectors(vectors); // Assumes this handles Pinecone interaction
        processedFilesInfo.push({ name: originalFileName, chunks: fileChunks.length });
      } else {
          console.warn(`No vectors generated for ${originalFileName}.`);
      }
    } // End of loop through files

    console.log('--- /api/upload processing successful ---');
    return NextResponse.json({
      success: true,
      message: `${processedFilesInfo.length} file(s) processed successfully.`,
      processedFiles: processedFilesInfo,
    });

  } catch (error) {
    console.error('--- ERROR in /api/upload ---:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json(
      { error: 'Failed to process upload due to a server error.', details: errorMessage },
      { status: 500 }
    );
  }
}