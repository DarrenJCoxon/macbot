// app/lib/document-utils.ts

// REMOVED: import { VectorDocument } from './embedding-utils'; // This caused the error
import { nanoid } from 'nanoid';

// --- Define VectorDocument interface LOCALLY ---
// This defines the structure returned by createVectorDocuments
export interface VectorDocument {
    id: string; // Now required, as nanoid() always provides one
    text: string; // The main content chunk
    // Define metadata structure created by createVectorDocuments
    metadata: {
        title: string;
        source: string;
        type: string;
        chunkIndex: number; // Added by createVectorDocuments
        totalChunks: number; // Added by createVectorDocuments
        // Include other potential fields passed in the input metadata object
        [key: string]: string | number | boolean | undefined;
    };
}
// --- End local definition ---


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
      // Ensure breakpoint is actually within the current intended chunk
      if (breakPoint > startIndex && breakPoint < endIndex) {
          endIndex = breakPoint;
      } else {
          // If no good break point, try moving back slightly less aggressively?
          // Or just take the maxChunkSize cut. For simplicity, we take the cut.
      }
    }

    // Extract chunk
    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk) { // Only add non-empty chunks
      chunks.push(chunk);
    }

    // Set next start index with overlap, ensure progress
    const nextStart = endIndex - overlap;
    // Prevent getting stuck if overlap is too large or chunks are tiny
    startIndex = Math.max(nextStart, startIndex + 1);

    // Safety break if somehow startIndex doesn't advance
    if (startIndex >= text.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Create vector documents from text chunks using the locally defined VectorDocument type
 */
export function createVectorDocuments(
  chunks: string[],
  // Input metadata type can be more specific if needed
  metadata: {
    title: string;
    source: string;
    type: string;
    // Allow other passthrough fields
    [key: string]: string | number | boolean | undefined;
  }
): VectorDocument[] { // Function returns an array of the locally defined VectorDocument
  const totalChunks = chunks.length;
  return chunks.map((chunk, index) => ({
    id: nanoid(), // Generate a unique ID for each document/chunk object
    text: chunk, // The actual text chunk
    metadata: {
      ...metadata, // Spread the metadata provided as input
      chunkIndex: index, // Add the 0-based index of this chunk
      totalChunks: totalChunks, // Add the total number of chunks for this document
    },
  }));
}

/**
 * Extract text content from a file using FileReader (Browser environment only)
 * Basic implementation for .txt files
 * Note: This function will only work in a browser context, not in Node.js server-side code
 * unless you polyfill FileReader or use Node's fs module there.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // Check if running in a browser context where FileReader is available
  if (typeof FileReader === 'undefined') {
      return Promise.reject(new Error('FileReader API is not available in this environment. Cannot extract text.'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      // Ensure result is a string before resolving
      if (event.target?.result && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read file content as text.'));
      }
    };

    reader.onerror = () => {
      // Provide the error from the reader if possible
      reject(new Error(`Error reading file: ${reader.error?.message || 'Unknown error'}`));
    };

    // Read as text. For non-text files, this will likely produce gibberish or fail.
    // Add checks for file type before calling this if necessary.
    if (file.type.startsWith('text/')) {
        reader.readAsText(file);
    } else {
         console.warn(`Attempting to read non-text file (${file.type}) as text. Content may be incorrect.`);
         reader.readAsText(file); // Proceed but warn
         // OR: reject(new Error(`Unsupported file type for text extraction: ${file.type}`));
    }
  });
}