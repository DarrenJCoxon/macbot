// app/components/Chat.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react'; // Added useEffect
import { nanoid } from 'nanoid';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import FileUpload from './FileUpload'; // Use this for user uploads
import {
  ChatContainer,
  MessagesList,
  LoadingIndicator
} from '@/app/styles/ChatStyles';
import { Message } from '@/app/types';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'system-1',
      role: 'system',
      // Updated system prompt to reflect focus on user uploads
      content: "You are Macbot, an AI assistant specialized in helping students understand Shakespeare's Macbeth. You can explain themes, characters, plot points, literary devices, and historical context based on the documents YOU upload using the 'Upload Macbeth Documents' button. Your responses should be educational, clear, and engaging. Cite the relevant document when possible. If you don't know an answer or the documents don't contain it, state that clearly."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For chat response loading
  // State to track if *any* files have been successfully uploaded in this session
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
  // State for displaying upload status feedback
  const [uploadStatus, setUploadStatus] = useState<{ error: boolean; message: string | null }>({ error: false, message: null });

  // Effect to automatically clear status messages after a delay
  useEffect(() => {
    if (uploadStatus.message) {
        const timer = setTimeout(() => {
            setUploadStatus({ error: false, message: null });
        }, 5000); // Clear message after 5 seconds
        return () => clearTimeout(timer);
    }
  }, [uploadStatus]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Handles files selected via the FileUpload component
  const handleFileUpload = async (files: File[]) => {
    console.log('[Chat.tsx] handleFileUpload received files:', files);
    setUploadStatus({ error: false, message: 'Uploading...' }); // Show uploading status

    if (!files || files.length === 0) {
        console.error('[Chat.tsx] handleFileUpload received no files!');
        setUploadStatus({ error: true, message: 'No files were selected.' });
        return;
    }

    // Prepare form data for the /api/upload route
    const formData = new FormData();
    const serverExpectedFileKey = 'files'; // Key expected by /api/upload
    let fileAppendError = false;

    files.forEach((file, index) => {
      if (file instanceof File) {
          formData.append(serverExpectedFileKey, file, file.name);
          console.log(`[Chat.tsx] Appended file ${index}: ${file.name} to formData with key '${serverExpectedFileKey}'`);
      } else {
          console.error(`[Chat.tsx] Item at index ${index} is not a valid File object:`, file);
          setUploadStatus({ error: true, message: `Invalid item detected during upload.` });
          fileAppendError = true; // Set flag
      }
    });

    // Stop if there was an issue appending files
    if (fileAppendError) return;

    // Verify formData content before sending (for debugging)
    const formDataKeys = Array.from(formData.keys());
    console.log('[Chat.tsx] FormData keys before sending:', formDataKeys);
    const filesInFormData = formData.getAll(serverExpectedFileKey);
    console.log(`[Chat.tsx] Final check: formData.getAll('${serverExpectedFileKey}') found ${filesInFormData.length} entries.`);
    if (filesInFormData.length !== files.length) {
        console.error(`[Chat.tsx] Mismatch! Files appended (${files.length}) vs files in FormData (${filesInFormData.length}). Upload aborted.`);
        setUploadStatus({ error: true, message: `Internal error preparing upload data. Please try again.` });
        return;
    }

    console.log('[Chat.tsx] Sending fetch request to /api/upload...');
    try {
        // Send files to the dedicated upload endpoint
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        console.log(`[Chat.tsx] Received response from /api/upload with status: ${response.status}`);

        // Handle response from the upload API
        if (!response.ok) {
            let errorDetails = `Server returned status ${response.status}`;
            try {
                 const errorData = await response.json();
                 errorDetails = errorData.error || errorData.details || errorData.message || JSON.stringify(errorData);
            } catch {
                 try { errorDetails = await response.text(); } catch {} // Fallback to text
            }
            console.error(`[Chat.tsx] File upload fetch failed! Status: ${response.status}, Details: ${errorDetails}`);
            setUploadStatus({ error: true, message: `Upload failed: ${errorDetails}` });
            // Propagate error to FileUpload component's catch block if needed
            throw new Error(`File upload failed: ${errorDetails}`);
        }

        // Success Handling
        setHasUploadedFiles(true); // Set the flag indicating files are now available for RAG
        const responseData = await response.json();
        console.log('[Chat.tsx] File upload successful:', responseData);
        setUploadStatus({ error: false, message: responseData.message || 'Upload successful!' });

        // Get names of processed files from response for the confirmation message
        const processedFileNames = responseData.processedFiles?.map((f: { name: string }) => f.name) || [];
        const confirmationMessage = processedFileNames.length > 0
            ? `Processed: ${processedFileNames.join(', ')}. You can now ask questions about the content!`
            : "File processed. Ask questions about the content!"; // Fallback message

        // Add assistant message confirming the upload
        setMessages(prev => [
          ...prev,
          { id: nanoid(), role: 'assistant', content: confirmationMessage }
        ]);

    } catch (error) {
        // Catch network errors or errors thrown from !response.ok
        console.error('[Chat.tsx] Error during file upload fetch/processing:', error);
        if (!uploadStatus.error) { // Avoid overwriting specific error from !response.ok
             setUploadStatus({ error: true, message: error instanceof Error ? error.message : 'Upload network error.' });
        }
        // Error is caught here, no need to throw again unless FileUpload depends on it
    }
  };


  // Handles sending chat messages to the /api/chat route
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Create the user message object
    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: trimmedInput,
      createdAt: new Date()
    };

    // Add user message to state immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true); // Set loading state for AI response
    setInput(''); // Clear input field

    try {
      // Prepare request body for chat API
      // No filterFileName needed anymore
      const requestBody = {
          messages: [...messages, userMessage], // Send message history + new message
          useUploadedFiles: hasUploadedFiles, // Send flag to trigger RAG on server
      };
      console.log('[Chat.tsx] Sending chat request with body:', requestBody);

      // Call the chat API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // Handle chat API response
      if (!response.ok) {
        let errorDetails = `Chat API error! Status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetails = errorData.error || errorData.details || JSON.stringify(errorData);
        } catch {
            try { errorDetails = await response.text() || errorDetails; } catch {}
        }
         console.error(`[Chat.tsx] Chat API fetch error: ${errorDetails}`);
        throw new Error(errorDetails); // Throw to be caught below
      }

      // Process the streamed response
      if (response.body) {
        const responseId = nanoid();
        // Add empty assistant message placeholder
        setMessages(prev => [
          ...prev,
          { id: responseId, role: 'assistant', content: '' }
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';

        // Stream content into the placeholder message
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          responseText += chunk;

          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessageIndex = newMessages.findLastIndex(m => m.id === responseId);
            if (lastMessageIndex !== -1) {
                newMessages[lastMessageIndex] = { ...newMessages[lastMessageIndex], content: responseText };
            } else { /* Should not happen */ }
            return newMessages;
          });
        }
      } else {
          console.warn("[Chat.tsx] Chat API response was ok but had no body.");
          // Maybe add a default "empty response" message?
          setMessages(prev => [...prev, { id: nanoid(), role: 'assistant', content: "[Received empty response]" }]);
      }
      setIsLoading(false); // Clear loading state after streaming finishes

    } catch (error) {
      // Handle errors during chat API call or streaming
      console.error('[Chat.tsx] Error sending chat message or processing response:', error);
      setIsLoading(false); // Clear loading state on error
      // Add error message to the chat
      setMessages(prev => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: `Sorry, could not get a response. Error: ${error instanceof Error ? error.message : 'Unknown issue'}`,
        }
      ]);
    }
  }; // --- End handleSubmit ---


  // --- Component Render ---
  return (
    <ChatContainer>
      {/* FileUpload component triggers handleFileUpload */}
      <FileUpload onFileUpload={handleFileUpload} />

      {/* Display upload status message */}
       {uploadStatus.message && (
         <p style={{ padding: '8px 16px', color: uploadStatus.error ? 'red' : 'green', fontSize: '0.9em', textAlign: 'center' }}>
           {uploadStatus.message}
         </p>
       )}

      {/* Messages list */}
      <MessagesList>
        {messages.map(message =>
          message.role !== 'system' && ( // Don't render system messages
            <ChatMessage key={message.id} message={message} />
          )
        )}
        {/* Show loading indicator only when waiting for chat response */}
        {isLoading && <LoadingIndicator>Macbot is thinking</LoadingIndicator>}
      </MessagesList>

      {/* Chat input form */}
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading} // Disable input while AI is responding
      />
    </ChatContainer>
  );
} // --- End Chat Component ---