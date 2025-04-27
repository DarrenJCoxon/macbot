'use client';

import { useState, FormEvent } from 'react';
import { nanoid } from 'nanoid';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import FileUpload from './FileUpload';
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
      content: "You are Macbot, an AI assistant specialized in helping students understand Shakespeare's Macbeth. You can explain themes, characters, plot points, literary devices, and historical context. Your responses should be educational, clear, and engaging. When appropriate, cite specific acts, scenes, and lines from the play. If you don't know an answer, admit that rather than making up information. Always maintain an educational and supportive tone."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ error: boolean; message: string | null }>({ error: false, message: null });


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFileUpload = async (files: File[]) => {
    console.log('[Chat.tsx] handleFileUpload received files:', files);
    setUploadStatus({ error: false, message: 'Uploading files...' });

    if (!files || files.length === 0) {
        console.error('[Chat.tsx] handleFileUpload received no files!');
        setUploadStatus({ error: true, message: 'No files were selected.' });
        return;
    }

    const formData = new FormData();
    const serverExpectedFileKey = 'files';

    files.forEach((file, index) => {
      console.log(`[Chat.tsx] Preparing to append file ${index}:`, file); // Log the file object
      if (file instanceof File) {
          formData.append(serverExpectedFileKey, file, file.name);
          console.log(`[Chat.tsx] Appended file ${index}: ${file.name} (size: ${file.size}) to formData with key '${serverExpectedFileKey}'`);
      } else {
          console.error(`[Chat.tsx] Item at index ${index} is not a valid File object:`, file);
          setUploadStatus({ error: true, message: `Invalid item detected during upload preparation.` });
          return; // Stop if an invalid item is found
      }
    });

    const formDataKeys = Array.from(formData.keys());
    console.log('[Chat.tsx] FormData keys before sending:', formDataKeys);
    if (!formDataKeys.includes(serverExpectedFileKey)) {
        console.error(`[Chat.tsx] Critical error: FormData does not contain the key '${serverExpectedFileKey}' after appending files.`);
        setUploadStatus({ error: true, message: `Internal error preparing upload data.` });
        return;
    }

    // --- ADDING FINAL CHECK ---
    const filesInFormData = formData.getAll(serverExpectedFileKey);
    console.log(`[Chat.tsx] Final check: formData.getAll('${serverExpectedFileKey}') found ${filesInFormData.length} entries.`);
    if (filesInFormData.length !== files.length) {
        console.error(`[Chat.tsx] Mismatch! Expected ${files.length} files in FormData, but getAll found ${filesInFormData.length}.`);
        // Log the entries found for more detail
        filesInFormData.forEach((entry, idx) => console.log(`[Chat.tsx] FormData entry ${idx}:`, entry));
    } else {
        console.log(`[Chat.tsx] Final check: Number of files in FormData matches input files array.`);
    }
    // --- END FINAL CHECK ---


    console.log('[Chat.tsx] Sending fetch request to /api/upload...');
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            // No Content-Type header needed here
        });

        console.log(`[Chat.tsx] Received response from /api/upload with status: ${response.status}`);

        if (!response.ok) {
            let errorDetails = `Server returned status ${response.status}`;
            try {
                 const errorData = await response.json();
                 errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
            } catch {
                 try { errorDetails = await response.text(); } catch {}
            }
            console.error(`[Chat.tsx] File upload fetch failed! Status: ${response.status}, Details: ${errorDetails}`);
            setUploadStatus({ error: true, message: `Upload failed: ${errorDetails}` });
            throw new Error(`File upload failed: ${errorDetails}`);
        }

        // Success Handling
        setHasUploadedFiles(true);
        const responseData = await response.json();
        console.log('[Chat.tsx] File upload successful. Response data:', responseData);
        setUploadStatus({ error: false, message: responseData.message || 'Files uploaded successfully!' });

        const processedFileNames = responseData.processedFiles?.map((f: { name: string }) => f.name) || responseData.fileNames || [];
        setMessages(prev => [
          ...prev,
          {
            id: nanoid(),
            role: 'assistant',
            content: `I've processed your ${processedFileNames.length > 1 ? 'files' : 'file'}: ${processedFileNames.join(', ')}. You can now ask me questions about the content!`,
          }
        ]);

    } catch (error) {
        console.error('[Chat.tsx] Error during file upload fetch or processing:', error);
        if (!uploadStatus.error) {
             setUploadStatus({ error: true, message: error instanceof Error ? error.message : 'An unknown network error occurred during upload.' });
        }
    }
  };


  // --- handleSubmit function remains the same ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: input,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          useUploadedFiles: hasUploadedFiles,
        }),
      });

      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetails = errorData.error || JSON.stringify(errorData);
        } catch {
            try { errorDetails = await response.text() || errorDetails; } catch {}
        }
         console.error(`[Chat.tsx] Chat API error: ${errorDetails}`);
        throw new Error(errorDetails);
      }

      if (response.body) {
        const responseId = nanoid();
        setMessages(prev => [
          ...prev,
          { id: responseId, role: 'assistant', content: '' }
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';

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
            } else {
                console.error("[Chat.tsx] Could not find message with ID to update:", responseId);
            }
            return newMessages;
          });
        }
        setIsLoading(false);
      } else {
          console.warn("[Chat.tsx] Chat API response was ok but had no body.");
          setIsLoading(false);
      }
    } catch (error) {
      console.error('[Chat.tsx] Error sending chat message:', error);
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: `Sorry, there was an error generating a response. Details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      ]);
    }
  };


  return (
    <ChatContainer>
      <FileUpload onFileUpload={handleFileUpload} />
       {uploadStatus.message && (
         <p style={{ padding: '8px 16px', color: uploadStatus.error ? 'red' : 'green', fontSize: '0.9em' }}>
           Upload Status: {uploadStatus.message}
         </p>
       )}
      <MessagesList>
        {messages.map(message =>
          message.role !== 'system' && (
            <ChatMessage key={message.id} message={message} />
          )
        )}
        {isLoading && <LoadingIndicator>Macbot is thinking</LoadingIndicator>}
      </MessagesList>
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </ChatContainer>
  );
}