import { NextResponse } from 'next/server';
import { Message } from '@/app/types';
import togetherClient, { modelName } from '@/app/lib/together-client';
import { querySimilarDocuments, formatRetrievedContext } from '@/app/lib/embedding-utils';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    console.log("API route called with messages:", messages);
    
    // Extract the latest user message for context retrieval
    const latestUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    
    // Retrieve relevant context from Pinecone if there's a user message
    let contextPrompt = '';
    if (latestUserMessage) {
      try {
        // Get similar documents from vector store
        const similarDocs = await querySimilarDocuments(latestUserMessage.content, 3);
        
        // Format retrieved documents into context
        if (similarDocs.length > 0) {
          contextPrompt = formatRetrievedContext(similarDocs);
          console.log("Retrieved context:", contextPrompt);
        }
      } catch (error) {
        console.error("Error retrieving context:", error);
        // Continue without context if retrieval fails
      }
    }
    
    // Add system message with context if we have it
    const systemMessage = {
      role: 'system' as const,
      content: `You are Macbot, an AI assistant specialized in helping students understand Shakespeare's Macbeth. You can explain themes, characters, plot points, literary devices, and historical context. Your responses should be educational, clear, and engaging. When appropriate, cite specific acts, scenes, and lines from the play. If you don't know an answer, admit that rather than making up information. Always maintain an educational and supportive tone.${contextPrompt ? '\n\n' + contextPrompt : ''}`
    };
    
    // Format messages for Together.ai, adding the system message with context
    const formattedMessages = [
      systemMessage,
      ...messages.filter(msg => msg.role !== 'system').map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      }))
    ];
    
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