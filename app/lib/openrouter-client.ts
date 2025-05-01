// app/lib/openrouter-client.ts
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || 'https://macbot-app.vercel.app';
const OPENROUTER_SITE_NAME = process.env.OPENROUTER_SITE_NAME || 'MacBot Shakespeare Assistant';

// Check if the API key is defined
if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY environment variable");
}

// Default model configuration
export const modelName = "x-ai/grok-3-mini-beta";

// Basic headers required for OpenRouter
export const openRouterHeaders = {
  "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
  "HTTP-Referer": OPENROUTER_SITE_URL,
  "X-Title": OPENROUTER_SITE_NAME,
  "Content-Type": "application/json"
};

// Base URL for OpenRouter API
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Basic streaming request function
export async function streamCompletion(messages: Array<{role: string, content: string}>) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }
  
  return fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      ...openRouterHeaders,
      "Accept": "text/event-stream",
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });
}

export default {
  streamCompletion,
  headers: openRouterHeaders,
  modelName,
};