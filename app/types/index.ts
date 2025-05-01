// app/types/index.ts

// Message Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

// Chat History Type
export interface ChatHistory {
  messages: Message[];
}

// Together.ai Response Types (or OpenRouter if used)
export interface LLMStreamChunk { // Renamed for generic use
  choices: {
    delta: {
      content?: string;
    };
    index: number;
  }[];
}

// Add new types for file handling
export interface UploadedFile {
  id: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

export interface FileChunk {
  id: string;
  fileId: string;
  content: string;
  metadata: {
    // Existing fields
    fileName: string;
    chunkIndex: number;
    pageNumber?: number; // Still optional

    // --- ADDED FIELDS ---
    docTitle?: string;   // Title from the upload metadata (optional)
    docSource?: string;  // Source from the upload metadata (optional)
    docType?: string;    // Type from the upload metadata (optional)
    // --- END ADDED FIELDS ---
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string; // The actual text content of the chunk
  metadata: {
    // Existing fields
    fileName: string;
    chunkIndex: number;
    pageNumber?: number; // Still optional

    // --- ADDED FIELDS (mirrored from FileChunk/Pinecone) ---
    docTitle?: string;
    docSource?: string;
    docType?: string;
    uploadedAt?: string; // Include timestamp if available from Pinecone
    // --- END ADDED FIELDS ---
  };
}