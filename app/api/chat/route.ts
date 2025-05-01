// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { streamCompletion, modelName } from '@/app/lib/openrouter-client';
import { querySimilarChunks } from '@/app/lib/pinecone-client';
import { generateEmbedding } from '@/app/lib/embedding-utils';
import { Message, VectorSearchResult } from '@/app/types';

export async function POST(req: Request) {
  console.log('--- /api/chat endpoint hit ---');
  try {
    const { messages, useUploadedFiles }: { messages: Message[], useUploadedFiles?: boolean } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid request: 'messages' array not found.");
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    console.log(`Received ${messages.length} messages. useUploadedFiles: ${useUploadedFiles}`);

    let retrievedContextText = '';
    let retrievedChunks: VectorSearchResult[] = [];

    // RAG Process: Same as before
    const latestUserMessage = messages.findLast((msg) => msg.role === 'user');

    if (latestUserMessage?.content) {
      console.log(`[RAG] Attempting RAG for query:`, latestUserMessage.content.substring(0, 100) + "...");
      try {
        const queryEmbeddingVector = await generateEmbedding(latestUserMessage.content);
        console.log("[RAG] Query embedding generated.");

        if (queryEmbeddingVector && queryEmbeddingVector.length > 0) {
          console.log("[RAG] Querying Pinecone for similar chunks...");
          retrievedChunks = await querySimilarChunks(
            queryEmbeddingVector,
            3 // Retrieve top 3 chunks
          );
          console.log(`[RAG] Retrieved ${retrievedChunks.length} chunks from Pinecone.`);

          if (retrievedChunks.length > 0) {
            retrievedContextText = `--- START CONTEXT FROM UPLOADED DOCUMENTS ---\n${
              retrievedChunks.map((chunk, idx) =>
                `[Context Chunk ${idx + 1} | Source: ${chunk.metadata.fileName} | Chunk Index: ${chunk.metadata.chunkIndex}]\n${chunk.content}`
              ).join('\n\n---\n\n')
            }\n--- END CONTEXT FROM UPLOADED DOCUMENTS ---`;
            console.log('[RAG] Formatted Context Text Prepared.');
          } else {
            console.log("[RAG] No relevant chunks found in Pinecone.");
          }
        } else {
          console.log("[RAG] Skipping Pinecone query due to invalid/empty embedding vector.");
        }
      } catch (ragError) {
        console.error("[RAG] Error during RAG retrieval/embedding:", ragError);
        retrievedContextText = '';
      }
    }

    // Prepare Messages Array for LLM (same as before)
    const messagesForLLM = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // System prompt logic (same as before)
    const systemPromptIndex = messagesForLLM.findIndex(msg => msg.role === 'system');
    const baseSystemPrompt = "You are Macbot, an AI assistant specialized in helping students understand Shakespeare's Macbeth. You can explain themes, characters, plot points, literary devices, and historical context. Your responses should be educational, clear, and engaging. When appropriate, cite specific acts, scenes, and lines from the play. If you don't know an answer, admit that rather than making up information. Always maintain an educational and supportive tone.";
    const contextInstruction = "\n\nIMPORTANT: If relevant context from uploaded documents is provided in a subsequent system message, prioritize using that information to answer the user's query. Base your response primarily on the provided document context if it's relevant.";

    if (systemPromptIndex !== -1) {
      messagesForLLM[systemPromptIndex].content = baseSystemPrompt + contextInstruction;
    } else {
      messagesForLLM.unshift({ role: 'system', content: baseSystemPrompt + contextInstruction });
    }

    // Inject Retrieved Context (same logic as before)
    if (retrievedContextText) {
      const lastUserMessageIndex = messagesForLLM.findLastIndex((msg) => msg.role === 'user');
      if (lastUserMessageIndex !== -1) {
        messagesForLLM.splice(lastUserMessageIndex, 0, {
          role: 'system',
          content: `Use the following context to answer the user's question:\n${retrievedContextText}`
        });
        console.log("[Prompt Injection] Injected retrieved context as system message.");
      } else if (systemPromptIndex !== -1) {
        messagesForLLM[systemPromptIndex].content += `\n\nRetrieved Context:\n${retrievedContextText}`;
        console.log("[Prompt Injection] Appended context to main system prompt (fallback).");
      }
    }

    console.log(`\n--- Sending ${messagesForLLM.length} Messages to LLM (${modelName}) ---`);
    console.log(JSON.stringify(messagesForLLM, null, 2));
    console.log('--- End LLM Payload ---\n');

    // === CHANGED: Using OpenRouter instead of Together.ai ===
    const response = await streamCompletion(messagesForLLM);
    
    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      throw new Error(`OpenRouter API error: ${error}`);
    }
    
    console.log("Received stream response from OpenRouter.");

    // === CHANGED: Stream handling for OpenRouter format ===
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = response.body?.getReader();
        
        if (!reader) {
          controller.error(new Error("Failed to get reader from response"));
          return;
        }
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Convert the chunk to text
            const chunk = new TextDecoder().decode(value);
            
            // Process SSE format - handle multiple events in a chunk
            const events = chunk
              .split('\n\n')
              .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
            
            for (const event of events) {
              // Extract JSON data from "data: {json}" format
              const jsonMatch = event.match(/data: (.+)$/m);
              if (!jsonMatch) continue;
              
              try {
                const jsonData = JSON.parse(jsonMatch[1]);
                const content = jsonData.choices?.[0]?.delta?.content || '';
                
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                console.error("Error parsing chunk:", e);
              }
            }
          }
        } catch (error) {
          console.error("Streaming error from OpenRouter:", error);
          controller.error(error);
        } finally {
          console.log("LLM response stream finished.");
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    console.error('--- Error in chat API route ---:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    );
  }
}