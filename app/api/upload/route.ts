// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';

// Import embedding generation and Pinecone client
// Ensure these imports point to the corrected files from previous steps
import { generateEmbeddings } from '@/app/lib/embeddings';
import { insertVectors } from '@/app/lib/pinecone-client';
import { FileChunk } from '@/app/types';

// Set up uploads directory (ensure permissions allow writing)
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
  }
} catch (error) {
    console.error(`FATAL: Failed to create or access uploads directory: ${uploadsDir}`, error);
    // If the directory can't be created, uploads will likely fail.
}


export async function POST(req: Request) {
  // --- Step 1: Log entry into the route ---
  console.log('--- /api/upload endpoint hit ---');
  try {
    // --- Step 2: Log before reading formData ---
    console.log('Attempting to read formData...');
    const formData = await req.formData();
    console.log('FormData read successfully.');

    // --- Step 3: Log before getting files and check the key ---
    const filesKey = 'files'; // The key used on the client-side formData.append('files', file)
    console.log(`Attempting to get files using key: '${filesKey}'...`);
    // Use getAll to handle multiple files with the same key
    const files = formData.getAll(filesKey) as File[]; // Type assertion, assumes client sends File objects
    // --- Step 4: Log how many files were found ---
    console.log(`Received ${files?.length ?? 'undefined/null'} file(s) under key '${filesKey}'`);

    // --- Step 5: Check if files array is valid ---
    if (!files || files.length === 0) {
      console.log(`Validation failed: No files found in formData for key '${filesKey}'. Returning 400.`);
      // This is the most likely cause of the 400 Bad Request
      return NextResponse.json(
        { error: `No files uploaded under the key '${filesKey}'` },
        { status: 400 }
      );
    }

    // --- If files are found, proceed with processing ---
    console.log(`Found ${files.length} file(s). Starting processing loop...`);
    const fileNames: string[] = [];
    const processedFilesInfo: Array<{ name: string; chunks: number }> = [];

    for (const file of files) {
      // Validate that the item is actually a File object (more robust check)
      if (!(file instanceof File)) {
          console.warn("Received an item in formData that is not a File object, skipping:", file);
          continue;
      }

      const fileId = nanoid(10); // Short unique ID for this file processing instance
      const originalFileName = file.name;
      fileNames.push(originalFileName);
      console.log(`Processing file: ${originalFileName} (size: ${file.size} bytes) with ID: ${fileId}`);

      // --- Optional: Save raw file to disk ---
      // Consider if this is necessary. If only processing content, maybe skip saving.
      const tempFilePath = join(uploadsDir, `${fileId}-${originalFileName}`);
      console.log(`Attempting to write temporary file to: ${tempFilePath}`);
      try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await writeFile(tempFilePath, buffer);
          console.log(`Temporary file written successfully.`);
      } catch (writeError) {
          console.error(`Error writing temporary file ${tempFilePath}:`, writeError);
          // Decide if this is a critical error or if processing can continue from buffer
          // For now, we'll throw to indicate a problem saving the file if it's needed later
          throw new Error(`Failed to write temporary file for ${originalFileName}`);
      }


      // --- Extract Text ---
      // Important: Implement robust extraction for PDF/DOCX using libraries
      let fileContent = '';
      const fileExt = path.extname(originalFileName).toLowerCase();
      console.log(`Extracting content for type: ${fileExt}`);
      const buffer = Buffer.from(await file.arrayBuffer()); // Read buffer again if not saved or passed

      if (fileExt === '.txt' || fileExt === '.md') {
        fileContent = buffer.toString('utf-8');
      } else if (fileExt === '.pdf') {
        // TODO: integrate pdf-parse
        console.warn("PDF parsing not implemented. Using placeholder content.");
        fileContent = `Placeholder content for PDF: ${originalFileName}`;
      } else if (fileExt === '.docx') {
        // TODO: integrate mammoth
        console.warn("DOCX parsing not implemented. Using placeholder content.");
        fileContent = `Placeholder content for DOCX: ${originalFileName}`;
      } else {
          console.warn(`Unsupported file type '${fileExt}' for content extraction. Skipping content processing for ${originalFileName}.`);
          // Skip embedding and insertion for unsupported types if content is required
           continue;
      }
      console.log(`Content extracted/placeholder generated (length: ${fileContent?.length || 0})`);


      // --- Split into Chunks ---
      if (!fileContent) {
          console.warn(`No content available for ${originalFileName}, skipping chunking and embedding.`);
          continue;
      }
      const chunkSize = 1000; // Characters per chunk
      const overlap = 200;   // Overlap between chunks
      const fileChunks: FileChunk[] = [];
      console.log(`Splitting into chunks (size: ${chunkSize}, overlap: ${overlap})...`);
      for (let i = 0; i < fileContent.length; i += (chunkSize - overlap)) {
        const chunkEnd = Math.min(i + chunkSize, fileContent.length);
        const chunkContent = fileContent.slice(i, chunkEnd);
        if (chunkContent.trim()) { // Only add non-empty chunks
            fileChunks.push({
              id: `${fileId}-chunk-${fileChunks.length}`, // Unique ID per chunk
              fileId: fileId, // Link back to the file process
              content: chunkContent,
              metadata: {
                fileName: originalFileName, // Original name for reference
                chunkIndex: fileChunks.length, // 0-based index
                pageNumber: undefined, // TODO: Add page number extraction if possible
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
      // generateEmbeddings should handle converting metadata numbers to strings
      const vectors = await generateEmbeddings(fileChunks); // Using mock or real implementation

      // --- Upsert into Pinecone ---
      if (vectors && vectors.length > 0) {
        // insertVectors expects correctly formatted metadata (strings) from generateEmbeddings
        await insertVectors(vectors);
        processedFilesInfo.push({ name: originalFileName, chunks: fileChunks.length });
      } else {
          console.warn(`No vectors generated for ${originalFileName}.`);
      }

       // --- Optional: Cleanup temp file ---
       try {
           if (fs.existsSync(tempFilePath)) {
             await fs.promises.unlink(tempFilePath);
             console.log(`Cleaned up temporary file: ${tempFilePath}`);
           }
       } catch (cleanupError) {
           console.error(`Error cleaning up temporary file ${tempFilePath}:`, cleanupError);
           // Non-critical, log and continue
       }

    } // End of loop through files

    console.log('--- /api/upload processing successful ---');
    // Send back meaningful success response
    return NextResponse.json({
      success: true,
      message: `${processedFilesInfo.length} file(s) processed successfully.`,
      processedFiles: processedFilesInfo, // Contains name and chunk count for processed files
      // fileNames: fileNames // Redundant if using processedFilesInfo
    });

  } catch (error: unknown) {
    // --- Step 6: Log any caught errors ---
    console.error('--- ERROR in /api/upload ---:', error);
    // Determine if it's a known error type or generic
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    // Return a 500 Internal Server Error for unexpected issues
    return NextResponse.json(
      { error: 'Failed to process upload due to a server error.', details: errorMessage },
      { status: 500 }
    );
  }
}