'use client';

import { useState, FormEvent } from 'react';
import { nanoid } from 'nanoid';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Create user message
    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: input,
      createdAt: new Date()
    };
    
    // Add to messages
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    
    try {
      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (response.body) {
        // Create message container for the response
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
          
          const chunk = decoder.decode(value);
          responseText += chunk;
          
          // Update the most recent message
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.id === responseId) {
              lastMessage.content = responseText;
            }
            return newMessages;
          });
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: 'Sorry, there was an error generating a response. Please try again.',
        }
      ]);
    }
  };

  return (
    <ChatContainer>
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