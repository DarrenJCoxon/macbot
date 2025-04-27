import { VectorDocument } from './embedding-utils';
import { nanoid } from 'nanoid';

/**
 * Function to split text into chunks of manageable size
 * @param text Full text to be split
 * @param maxChunkSize Maximum characters per chunk
 * @param overlap Number of characters to overlap between chunks
 */
export function splitTextIntoChunks(
  text: string, 
  maxChunkSize: number = 1000, 
  overlap: number = 200
): string[] {
  // If text is already small enough, return as is
  if (!text || text.length <= maxChunkSize) {
    return text ? [text] : [];
  }
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Calculate end index for current chunk
    let endIndex = Math.min(startIndex + maxChunkSize, text.length);
    
    // Adjust to avoid cutting words in the middle
    if (endIndex < text.length) {
      // Find the last space or newline in the current chunk
      const lastSpace = text.lastIndexOf(' ', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      
      // Use the closer one to the end
      const breakPoint = Math.max(lastSpace, lastNewline);
      
      // If no space or newline found, use the original endpoint
      if (breakPoint > startIndex) {
        endIndex = breakPoint;
      }
    }
    
    // Extract chunk
    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    
    // Set next start index with overlap
    startIndex = Math.max(endIndex - overlap, startIndex + 1);
    
    // Safety check - if we're not making progress, exit the loop
    if (startIndex >= text.length) {
      break;
    }
  }
  
  return chunks;
}

/**
 * Create vector documents from text chunks
 */
export function createVectorDocuments(
  chunks: string[],
  metadata: {
    title: string;
    source: string;
    type: string;
    [key: string]: string | number | boolean | undefined;
  }
): VectorDocument[] {
  return chunks.map((chunk, index) => ({
    id: nanoid(),
    text: chunk,
    metadata: {
      ...metadata,
      chunkIndex: index,
      totalChunks: chunks.length,
    },
  }));
}

/**
 * Extract text content from a file
 * Basic implementation for .txt files
 * In a production environment, add support for PDF, DOCX, etc.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    // Read as text for now
    // For PDFs and DOCX, you'd need specialized libraries
    reader.readAsText(file);
  });
}