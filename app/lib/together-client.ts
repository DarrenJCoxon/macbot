import Together from "together-ai";

// Check if the API key is defined
const apiKey = process.env.TOGETHER_API_KEY;

if (!apiKey) {
  console.error("Missing TOGETHER_API_KEY environment variable");
}

// Initialize the Together client
const togetherClient = new Together({
  apiKey: apiKey || "",
});

export const modelName = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";

export default togetherClient;