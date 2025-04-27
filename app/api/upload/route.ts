// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';

// Import embedding generation function
import { generateEmbeddings } from '@/app/lib/embeddings';
import { insertVectors } from '@/app/lib/pinecone-client';
import { FileChunk } from '@/app/types';

// Set up uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }
    
    const fileNames: string[] = [];
    const processedFiles = [];
    
    for (const file of files) {
      const fileId = nanoid();
      const fileName = file.name;
      fileNames.push(fileName);
      
      // Save file to disk (optional, for processing)
      const filePath = join(uploadsDir, `${fileId}-${fileName}`);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filePath, buffer);
      
      // Process file content
      let fileContent = '';
      
      if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        fileContent = buffer.toString('utf-8');
      } else if (fileName.endsWith('.pdf')) {
        // For PDF processing, you would need to add a PDF parsing library
        // like pdf-parse
        fileContent = "PDF processing would go here";
      } else if (fileName.endsWith('.docx')) {
        // For DOCX processing, you would need to add a DOCX parsing library
        // like mammoth
        fileContent = "DOCX processing would go here";
      }
      
      // Split content into chunks
      const chunkSize = 1000;
      const overlap = 200;
      const fileChunks: FileChunk[] = [];
      
      for (let i = 0; i < fileContent.length; i += chunkSize - overlap) {
        const chunkContent = fileContent.slice(i, i + chunkSize);
        fileChunks.push({
          id: `${fileId}-${fileChunks.length}`,
          fileId,
          content: chunkContent,
          metadata: {
            fileName,
            chunkIndex: fileChunks.length,
          },
        });
      }
      
      // Generate embeddings for each chunk
      const vectors = await generateEmbeddings(fileChunks);
      
      // Store in Pinecone
      await insertVectors(vectors);
      
      processedFiles.push({
        id: fileId,
        name: fileName,
        chunks: fileChunks.length,
      });
    }
    
    return NextResponse.json({
      success: true,
      fileNames,
      processedFiles,
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}