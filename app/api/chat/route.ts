// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import togetherClient, { modelName } from '@/app/lib/together-client';
import { querySimilarChunks } from '@/app/lib/pinecone-client';
import { generateEmbedding } from '@/app/lib/embedding-utils';
// Import necessary types from your types definition
import { Message, VectorSearchResult } from '@/app/types';

// Ensure runtime = 'edge' is commented out/removed if necessary
// export const runtime = 'edge';

export async function POST(req: Request) {
  console.log('--- /api/chat endpoint hit ---');
  try {
    // Receive body - no longer expecting filterFileName
    const { messages, useUploadedFiles }: { messages: Message[], useUploadedFiles?: boolean } = await req.json();

    // Basic validation
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid request: 'messages' array not found.");
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    console.log(`Received ${messages.length} messages. useUploadedFiles: ${useUploadedFiles}`);


    let retrievedContextText = ''; // Variable to store formatted context
    let retrievedChunks: VectorSearchResult[] = []; // Store retrieved chunks for inspection

    // --- RAG Process: Always attempt to retrieve context ---
    const latestUserMessage = messages.findLast((msg) => msg.role === 'user');

    if (latestUserMessage?.content) {
      // Log whether RAG was explicitly requested via uploads or we're checking anyway
      console.log(`[RAG] Attempting RAG for query (user uploaded files: ${useUploadedFiles ? 'yes' : 'no'}):`, 
                 latestUserMessage.content.substring(0, 100) + "...");
      try {
        const queryEmbeddingVector = await generateEmbedding(latestUserMessage.content);
        console.log("[RAG] Query embedding generated.");

        if (queryEmbeddingVector && queryEmbeddingVector.length > 0) { // Check embedding validity
          console.log("[RAG] Querying Pinecone for similar chunks (no filter)..."); 
          // Call querySimilarChunks WITHOUT the filter argument
          retrievedChunks = await querySimilarChunks(
            queryEmbeddingVector,
            3 // Retrieve top 3 chunks
            // No filterFileName argument passed
          );
          console.log(`[RAG] Retrieved ${retrievedChunks.length} chunks from Pinecone.`);

          // --- Log retrieved chunks content ---
          if (retrievedChunks.length > 0) {
              console.log('[RAG] Retrieved Chunks Details:', JSON.stringify(retrievedChunks, null, 2));
          }
          // --- End Log ---

          // Format context (uses retrievedChunks)
          if (retrievedChunks.length > 0) {
            retrievedContextText = `--- START CONTEXT FROM UPLOADED DOCUMENTS ---\n${
              retrievedChunks.map((chunk, idx) =>
                // Format each chunk clearly
                `[Context Chunk ${idx + 1} | Source: ${chunk.metadata.fileName} | Chunk Index: ${chunk.metadata.chunkIndex}]\n${chunk.content}`
              ).join('\n\n---\n\n') // Separator
            }\n--- END CONTEXT FROM UPLOADED DOCUMENTS ---`;
            console.log('[RAG] Formatted Context Text Prepared:\n', retrievedContextText);
          } else {
            console.log("[RAG] No relevant chunks found in Pinecone.");
          }
        } else {
          console.log("[RAG] Skipping Pinecone query due to invalid/empty embedding vector.");
        }
      } catch (ragError) {
        console.error("[RAG] Error during RAG retrieval/embedding:", ragError);
        // Do not add context if RAG failed
        retrievedContextText = '';
      }
    } else {
      console.log("[RAG] No latest user message content found for RAG query.");
    }


    // --- Prepare Messages Array for LLM ---
    const messagesForLLM = messages.map(msg => ({
        role: msg.role,
        content: msg.content
        // Only include fields the API expects
    }));

    // --- Modify System Prompt ---
    const systemPromptIndex = messagesForLLM.findIndex(msg => msg.role === 'system');
    // Define the base prompt and the instruction separately for clarity
    const baseSystemPrompt = "You are Macbot, an AI assistant specialized in helping students understand Shakespeare's Macbeth. You can explain themes, characters, plot points, literary devices, and historical context. Your responses should be educational, clear, and engaging. When appropriate, cite specific acts, scenes, and lines from the play. If you don't know an answer, admit that rather than making up information. Always maintain an educational and supportive tone.";
    const contextInstruction = "\n\nIMPORTANT: If relevant context from uploaded documents is provided in a subsequent system message, prioritize using that information to answer the user's query. Base your response primarily on the provided document context if it's relevant.";

    if (systemPromptIndex !== -1) {
        // Append instruction to existing system prompt
        messagesForLLM[systemPromptIndex].content = baseSystemPrompt + contextInstruction;
    } else {
        // Prepend a new system prompt if none exists
        messagesForLLM.unshift({ role: 'system', content: baseSystemPrompt + contextInstruction });
    }
    // --- End System Prompt Modification ---


    // --- Inject Retrieved Context ---
    if (retrievedContextText) { // Only inject if context was actually retrieved
      const lastUserMessageIndex = messagesForLLM.findLastIndex((msg) => msg.role === 'user');
      if (lastUserMessageIndex !== -1) {
        // Insert context as a system message before the last user message
        messagesForLLM.splice(lastUserMessageIndex, 0, {
          role: 'system',
          content: `Use the following context to answer the user's question:\n${retrievedContextText}`
        });
        console.log("[Prompt Injection] Injected retrieved context as system message.");
      } else {
        // Fallback: Append to main system prompt if no user message found (less likely)
        if (systemPromptIndex !== -1) {
            messagesForLLM[systemPromptIndex].content += `\n\nRetrieved Context:\n${retrievedContextText}`;
            console.log("[Prompt Injection] Appended context to main system prompt (fallback).");
        } else {
            // If still no system prompt, log warning - context won't be included
             console.warn("[Prompt Injection] Could not inject context: No user message and no system prompt found.");
        }
      }
    } else {
        console.log("[Prompt Injection] No retrieved context text to inject.");
    }
    // --- End Context Injection ---


    // --- Log Final Payload to LLM ---
    console.log(`\n--- Sending ${messagesForLLM.length} Messages to LLM (${modelName}) ---`);
    console.log(JSON.stringify(messagesForLLM, null, 2)); // Log the exact structure sent
    console.log('--- End LLM Payload ---\n');
    // --- End Log ---


    // --- Call Together.ai LLM ---
    const response = await togetherClient.chat.completions.create({
      messages: messagesForLLM,
      model: modelName,
      stream: true,
      temperature: 0.7, // Adjust temperature if needed (lower for less creativity)
      max_tokens: 1000, // Adjust max response length if needed
    });
    console.log("Received stream response header from Together.ai.");

    // --- Stream Response Back to Client ---
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
          console.error("Streaming error from Together.ai:", error);
          controller.error(error); // Propagate error to the client stream
        } finally {
          console.log("LLM response stream finished.");
          controller.close(); // Close the stream when done
        }
      },
    });

    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream', // Standard header for Server-Sent Events
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) { // Catch any synchronous errors or errors from non-stream setup
    console.error('--- Error in chat API route ---:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    // Return a JSON error response
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    );
  }
} // --- End POST handler ---