// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import togetherClient, { modelName } from '@/app/lib/together-client';
// REMOVE generateEmbeddings if only used for query, otherwise keep if needed elsewhere
// import { generateEmbeddings } from '@/app/lib/embeddings';
// Import the function needed for querying
import { querySimilarChunks } from '@/app/lib/pinecone-client';
// Import embedding generation specifically needed for the query
import { generateEmbedding } from '@/app/lib/embedding-utils'; // <-- Use this for single query embedding

// Define types locally for the API route
type MessageRole = 'user' | 'assistant' | 'system';

// export const runtime = 'edge'; // <--- REMOVE OR COMMENT OUT THIS LINE

export async function POST(req: Request) {
  try {
    const { messages, useUploadedFiles } = await req.json();

    console.log("API route called with messages:", messages);

    let contextFromFiles = '';

    if (useUploadedFiles) {
      const userMessages = messages.filter((msg: { role: MessageRole }) => msg.role === 'user');
      if (userMessages.length > 0) {
        const latestUserMessage = userMessages[userMessages.length - 1];

        console.log("Generating embedding for user query:", latestUserMessage.content);
        // Generate an embedding for the single user query using the correct function
        const queryEmbeddingVector = await generateEmbedding(latestUserMessage.content);
        console.log("Embedding generated.");


        // Check if we have the embedding vector
        if (queryEmbeddingVector && queryEmbeddingVector.length > 0) {
          console.log("Querying Pinecone for similar chunks...");
          // Search for similar chunks using the vector
          const similarChunks = await querySimilarChunks(
            queryEmbeddingVector, // Pass the vector directly
            3 // Get top 3 most relevant chunks
          );
          console.log(`Found ${similarChunks.length} similar chunks.`);

          // Format the context from retrieved chunks
          if (similarChunks && similarChunks.length > 0) {
            contextFromFiles = `
              \n\n--- Relevant Context from Uploaded Documents ---\n
              ${similarChunks.map(chunk =>
              `Source: ${chunk.metadata.fileName}\nContent: ${chunk.content}\n---`
            ).join('\n')}
              \n--- End Context ---\n\n
            `;
            console.log("Context from files prepared.");
          } else {
            console.log("No relevant chunks found in Pinecone for the query.");
          }
        } else {
          console.log("Failed to generate query embedding.");
        }
      }
    }

    // Format messages for Together.ai
    const formattedMessages = messages.map((msg: { role: MessageRole; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }));

    // If we have context from files, add it to the system message or latest user message
    // Adding context near the user's latest query can sometimes be more effective
    if (contextFromFiles) {
       // Find the last user message index
      const lastUserMessageIndex = formattedMessages.findLastIndex((msg: {role: MessageRole}) => msg.role === 'user');
      if (lastUserMessageIndex !== -1) {
          formattedMessages[lastUserMessageIndex].content += contextFromFiles;
          console.log("Added context to the last user message.");
      } else {
          // Fallback: Add to system message if no user message exists (unlikely in a chat)
          const systemMessageIndex = formattedMessages.findIndex((msg: { role: MessageRole }) => msg.role === 'system');
          if (systemMessageIndex >= 0) {
              formattedMessages[systemMessageIndex].content += contextFromFiles;
              console.log("Added context to the system message (fallback).");
          } else {
              // Fallback: Prepend a new system message with context (least ideal)
              formattedMessages.unshift({ role: 'system', content: contextFromFiles });
              console.log("Prepended context as a new system message (fallback).");
          }
      }
    }

    console.log("Sending request to Together.ai model:", modelName);
    // Initialize streaming response from Together.ai
    const response = await togetherClient.chat.completions.create({
      messages: formattedMessages,
      model: modelName,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });
    console.log("Received stream response from Together.ai.");

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
          console.log("Stream finished.");
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