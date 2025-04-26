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