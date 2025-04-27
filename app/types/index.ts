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
  
// Together.ai Response Types
export interface TogetherStreamChunk {
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
    fileName: string;
    pageNumber?: number;
    chunkIndex: number;
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: {
    fileName: string;
    pageNumber?: number;
    chunkIndex: number;
  };
}