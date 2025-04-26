import { NextResponse } from 'next/server';
import { Message } from '@/app/types';
import togetherClient, { modelName } from '@/app/lib/together-client';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    console.log("API route called with messages:", messages);
    
    // Format messages for Together.ai
    const formattedMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));
    
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