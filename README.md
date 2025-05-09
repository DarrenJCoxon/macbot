# Macbot: AI Shakespeare Companion 🎭📚

Macbot is an AI-powered chatbot designed to help students explore and understand Shakespeare's tragedy, Macbeth. Leveraging advanced AI technologies, Macbot provides insightful analysis, contextual understanding, and interactive learning.

## 🌟 Features

- AI-powered chat interface for Macbeth analysis
- Document upload functionality (.txt, .pdf, .docx, .md) for custom context
- Retrieval-Augmented Generation (RAG) using uploaded documents for precise responses
- Shakespearean-themed user interface
- Admin section for uploading and managing knowledge base documents

## 🚀 Prerequisites

Before deployment, you'll need to obtain API keys from:
1. [OpenRouter](https://openrouter.ai/) (for LLM access - supports various models)
2. [OpenAI](https://openai.com/) (for text embeddings)
3. [Pinecone](https://www.pinecone.io/) (for vector database)

## 📦 Tech Stack

- Next.js 14+ (or your current version)
- React
- TypeScript
- [OpenRouter](https://openrouter.ai/) LLM (Configured for Grok-3-Mini by default, adaptable)
- OpenAI Embeddings (`text-embedding-3-small`)
- Pinecone Vector Database (Serverless)
- Styled-Components (for theming)
- `pdfreader` (for server-side PDF text extraction)
- `mammoth` (for server-side DOCX text extraction)

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/macbot.git # Replace with your actual repo URL
cd macbot
```

### 2. Verify Node.js and npm/yarn

Ensure you have Node.js (version 18 or later recommended) and npm (or yarn) installed. You can check with:

```bash
node -v
npm -v
# or
yarn -v
```

### 3. Install Dependencies

This command reads the package.json file and installs all required libraries for the project to run. This includes:

- Core frameworks: next, react, react-dom
- Styling: styled-components
- AI clients: openai, @pinecone-database/pinecone
- Document Parsing: pdfreader (for PDFs), mammoth (for DOCX)
- And other necessary utilities.

```bash
npm install
# or
yarn install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root by copying the example `.env.example` (if you have one) or creating it manually. Add the following variables with your actual keys:

```
# OpenRouter API Key (for LLM)
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional but RECOMMENDED: Required by OpenRouter API TOS - Your app's public URL
# Use http://localhost:3000 for local dev, replace with deployed URL in production
OPENROUTER_SITE_URL=http://localhost:3000

# Optional: Your app's name for OpenRouter headers
OPENROUTER_SITE_NAME="MacBot Development"

# OpenAI API Key (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name # e.g., "macbot-index"
```

- Get your keys from the respective service websites.
- Choose a unique name for your PINECONE_INDEX.
- OPENROUTER_SITE_URL should be the URL where your app is accessible (even localhost during development).

### 5. Run the Development Server
```bash
npm run dev
# or
yarn dev
```

Open http://localhost:3000 in your browser. Access the admin section at http://localhost:3000/admin.

## 🌍 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fmacbot)

1. Connect your GitHub repository to Vercel.
2. Configure the Environment Variables in your Vercel project settings (using the same names as in `.env.local`). Remember to set OPENROUTER_SITE_URL to your actual Vercel deployment URL (e.g., https://your-app-name.vercel.app).
3. Deploy! Vercel will automatically build and deploy your Next.js app.

### Alternative Platforms

- Netlify
- Render
- AWS Amplify
- DigitalOcean App Platform

Ensure you set the same environment variables required in `.env.local` on your chosen platform. You might need to configure build settings specific to the platform.

## 🔍 Usage Tips

- Go to the `/admin` page (The Scribe's Chambers) to upload documents (.txt, .pdf, .docx, .md) into the knowledge base using the "Upload Documents" section.
- Use the "Uploaded Documents" section on the admin page to view indexed files and delete them from the Pinecone knowledge base if needed.
- Return to the main page ("Return to the Oracle") to chat.
- Ask specific questions about Macbeth. The AI will use the general model knowledge and retrieve relevant information from your uploaded documents via RAG.
- Explore themes, characters, and literary devices.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🎓 Disclaimer

Macbot is an educational tool and should be used as a supplement to reading and studying the original text. AI responses, especially those based on RAG, are dependent on the quality and content of the uploaded documents.

> "What's done cannot be undone." - Lady Macbeth
