// app/api/admin/upload-document/route.ts
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateEmbeddings } from '@/app/lib/embeddings';
import { insertVectors } from '@/app/lib/pinecone-client';
import { FileChunk } from '@/app/types';

// --- Import pdfreader ---
import { PdfReader } from 'pdfreader';

// Interface for the expected metadata structure from the form
interface UploadMetadata {
    title: string;
    source?: string;
    type?: string;
}

// Helper function to parse PDF buffer using pdfreader
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        let pdfText = '';
        let currentPage: number | null = null;
        const reader = new PdfReader();

        reader.parseBuffer(buffer, (err, item) => {
            // Check for error FIRST
            if (err) {
                console.error("pdfreader parsing error:", err); // Log the original error object

                // --- SIMPLIFIED Error Message Creation ---
                // Convert the error to a string in a safe way, avoiding specific property access
                const errorMessage = String(err);
                // --- END SIMPLIFIED ---

                reject(new Error(`Failed to parse PDF with pdfreader: ${errorMessage}`));
                return; // Stop processing on error
            }

            // Process item if no error
            if (!item) {
                // End of buffer/PDF
                console.log("pdfreader finished parsing.");
                const cleanedText = pdfText.replace(/ +/g, ' ').replace(/(\r\n|\n|\r){2,}/g, '\n').trim();
                resolve(cleanedText);
            } else if (item.page) {
                if (currentPage !== null) {
                    pdfText += '\n\n--- Page Change ---\n\n';
                }
                currentPage = item.page;
            } else if (item.text) {
                if (pdfText.length > 0 && pdfText[pdfText.length - 1] !== ' ') {
                   pdfText += ' ';
                }
                pdfText += item.text;
            }
        });
    });
}


export async function POST(req: Request) {
  console.log('--- /api/admin/upload-document endpoint hit ---');
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const metadataString = formData.get('metadata') as string | null;

    // --- Validation ---
    if (!file || !(file instanceof File)) { /* ... */ return NextResponse.json( { error: 'File is required' }, { status: 400 } ); }
    if (!metadataString) { /* ... */ return NextResponse.json( { error: 'Metadata JSON string is required' }, { status: 400 }); }
    let parsedMetadata: UploadMetadata;
    try {
        parsedMetadata = JSON.parse(metadataString);
        if (!parsedMetadata.title?.trim()) { /* ... */ return NextResponse.json({ error: 'Metadata requires a non-empty "title" field' }, { status: 400 }); }
        parsedMetadata.source = parsedMetadata.source || '';
        parsedMetadata.type = parsedMetadata.type || 'unknown';
    } catch (parseError) {
        console.error("Validation failed: Invalid metadata JSON.", parseError);
        return NextResponse.json({ error: 'Invalid metadata format.' }, { status: 400 });
    }
    // --- End Validation ---

    const fileId = nanoid(10);
    const originalFileName = file.name;
    console.log(`Processing file: ${originalFileName} (size: ${file.size} bytes, type: ${file.type}) with ID: ${fileId}`);
    console.log("Metadata:", parsedMetadata);

    // --- File Content Extraction ---
    let fileContent = '';
    const fileExt = file.name.toLowerCase().split('.').pop() || '';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer); // pdfreader needs the Buffer
    console.log(`File buffer read (size: ${buffer.length} bytes). Ext: .${fileExt}`);

    try {
      if (fileExt === 'txt' || fileExt === 'md') {
        console.log(`Parsing as text/markdown file.`);
        fileContent = buffer.toString('utf-8');
        console.log(`Extracted ${fileContent.length} characters from text/md.`);

      } else if (fileExt === 'pdf') {
        console.log(`Attempting to parse PDF using pdfreader...`);
        try {
            fileContent = await parsePdfBuffer(buffer);
            console.log(`Successfully extracted ${fileContent.length} characters from PDF using pdfreader.`);
        } catch (error) {
            console.error('--- PDFREADER PARSING FAILED ---');
             if (error instanceof Error) {
                 // Now error.message should be the string generated in parsePdfBuffer's reject
                 throw new Error(error.message);
            } else {
                 // Should be less likely to hit this 'else' now
                 throw new Error(`Failed to parse PDF using pdfreader due to an unknown error structure: ${String(error)}`);
            }
        }
      } else if (fileExt === 'docx' || fileExt === 'doc') {
            console.log(`Attempting to parse as Word (DOCX/DOC) file...`);
            try {
              const mammoth = await import('mammoth');
              const result = await mammoth.extractRawText({ buffer: buffer });
              fileContent = result.value;
              console.log(`Extracted ${fileContent.length} characters from Word document.`);
            } catch (error) {
              console.error('--- DOCX/DOC PARSING FAILED ---', error);
              throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
      } else {
        console.warn(`Unsupported file type: .${fileExt}`);
        return NextResponse.json({ error: `Unsupported file type: .${fileExt}` }, { status: 415 });
      }
    } catch (parsingError) {
      console.error(`Error during file content extraction for ${originalFileName}:`, parsingError);
      // Ensure we catch the specific error message thrown from the PDF/DOCX blocks
       const details = parsingError instanceof Error ? parsingError.message : 'Unknown parsing error';
      return NextResponse.json({
        error: `Failed to parse file content`,
        details: details
      }, { status: 500 });
    }
    // --- End File Content Extraction ---

    if (!fileContent || fileContent.trim().length === 0) {
      console.warn(`File content is empty after parsing for ${originalFileName}.`);
      return NextResponse.json({ error: 'Extracted file content is empty. Cannot process.' }, { status: 400 });
    }

    // --- Chunking, Embedding, Storing, Response (Keep as before) ---
    const chunkSize = 1000;
    const overlap = 200;
    const fileChunks: FileChunk[] = [];
    console.log(`Splitting content into chunks (size: ${chunkSize}, overlap: ${overlap})...`);
    if (fileContent) {
        for (let i = 0; i < fileContent.length; i += (chunkSize - overlap)) {
            const chunkEnd = Math.min(i + chunkSize, fileContent.length);
            const chunkContent = fileContent.slice(i, chunkEnd).trim();
            if (chunkContent) {
                const chunkId = `${fileId}-chunk-${fileChunks.length}`;
                fileChunks.push({
                  id: chunkId,
                  fileId: fileId,
                  content: chunkContent,
                  metadata: {
                    fileName: originalFileName,
                    docTitle: parsedMetadata.title,
                    docSource: parsedMetadata.source,
                    docType: parsedMetadata.type,
                    chunkIndex: fileChunks.length,
                    pageNumber: undefined,
                  },
                });
            }
            if (i + (chunkSize - overlap) <= i && fileContent.length > 0) {
                console.error("Chunking loop is not progressing, breaking.");
                break;
            }
        }
    } else {
        console.warn("Skipping chunking because fileContent is empty.");
    }

    if (fileChunks.length === 0) {
      console.error(`No chunks could be generated from the content of ${originalFileName}.`);
      return NextResponse.json({ error: 'No text chunks could be generated from the file content.' }, { status: 400 });
    }
    console.log(`Generated ${fileChunks.length} chunks for ${originalFileName}.`);

    try {
        console.log(`Generating embeddings for ${fileChunks.length} chunks...`);
        const vectors = await generateEmbeddings(fileChunks);
        if (!vectors || vectors.length === 0) {
            console.error(`Failed to generate embeddings for ${originalFileName}. generateEmbeddings returned empty/null.`);
            return NextResponse.json({ error: 'Failed to generate embeddings for the document chunks.' }, { status: 500 });
        }
        console.log(`Generated ${vectors.length} embedding vectors.`);
        console.log(`Inserting ${vectors.length} vectors into Pinecone...`);
        await insertVectors(vectors);
        console.log(`Successfully inserted vectors for ${originalFileName}.`);
    } catch (embeddingOrDbError) {
         console.error(`Error during embedding generation or database insertion for ${originalFileName}:`, embeddingOrDbError);
         return NextResponse.json({
             error: 'Failed to process embeddings or store data in the vector database.',
             details: embeddingOrDbError instanceof Error ? embeddingOrDbError.message : 'Unknown error'
         }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Document "${parsedMetadata.title}" (${originalFileName}) processed and indexed successfully with ${fileChunks.length} chunks using pdfreader.`,
      fileName: originalFileName,
      title: parsedMetadata.title,
      chunks: fileChunks.length,
      fileId: fileId,
    });


  } catch (error) {
    console.error('--- UNEXPECTED ERROR in /api/admin/upload-document ---:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json(
      { error: 'An unexpected server error occurred during document upload.', details: errorMessage },
      { status: 500 }
    );
  }
}