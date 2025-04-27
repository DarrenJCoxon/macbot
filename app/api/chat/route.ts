// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import togetherClient, { modelName } from '@/app/lib/together-client';
import { generateEmbeddings } from '@/app/lib/embeddings';
import { querySimilarChunks } from '@/app/lib/pinecone-client';

// Define types locally for the API route
type MessageRole = 'user' | 'assistant' | 'system';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, useUploadedFiles } = await req.json();
    
    console.log("API route called with messages:", messages);
    
    // If using uploaded files, get the most recent user message
    // and search for relevant context
    let contextFromFiles = '';
    
    if (useUploadedFiles) {
      const userMessages = messages.filter((msg: {role: MessageRole}) => msg.role === 'user');
      if (userMessages.length > 0) {
        const latestUserMessage = userMessages[userMessages.length - 1];
        
        // Generate an embedding for the query
        const queryEmbedding = await generateEmbeddings([
          {
            id: 'query',
            fileId: 'query',
            content: latestUserMessage.content,
            metadata: {
              fileName: 'query',
              chunkIndex: 0,
            },
          }
        ]);
        
        // Check if we have values from the embedding
        if (queryEmbedding && queryEmbedding[0]?.values) {
          // Search for similar chunks
          const similarChunks = await querySimilarChunks(
            queryEmbedding[0].values,
            3 // Get top 3 most relevant chunks
          );
          
          // Format the context from retrieved chunks
          if (similarChunks && similarChunks.length > 0) {
            contextFromFiles = `
              Additional context from uploaded documents:
              ${similarChunks.map(chunk => 
                `From "${chunk.metadata.fileName}":
                 ${chunk.content}
                 ---
                `
              ).join('\n')}
            `;
          }
        }
      }
    }
    
    // Format messages for Together.ai
    const formattedMessages = messages.map((msg: {role: MessageRole; content: string}) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // If we have context from files, add it to the system message
    if (contextFromFiles) {
      // Find existing system message index
      const systemMessageIndex = formattedMessages.findIndex((msg: {role: MessageRole}) => msg.role === 'system');
      
      if (systemMessageIndex >= 0) {
        // Update existing system message
        formattedMessages[systemMessageIndex].content += `\n\n${contextFromFiles}`;
      } else {
        // Add new system message with context
        formattedMessages.unshift({
          role: 'system',
          content: `You are Macbot, an AI assistant specialized in helping students understand Shakespeare's Macbeth. ${contextFromFiles}`,
        });
      }
    }
    
    // Initialize streaming response from Together.ai
    const response = await togetherClient.chat.completions.create({
      messages: formattedMessages,
      model: modelName,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    // Convert the stream to a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
    
    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}