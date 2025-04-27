// app/components/ChatMessage.tsx
'use client';

import { Message } from '@/app/types';
import { MessageBubble } from '@/app/styles/ChatStyles';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remark-gfm for extended syntax (tables, etc.)

type ChatMessageProps = {
  message: Message;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <MessageBubble $isUser={isUser}>
      {/*
        Conditionally render using ReactMarkdown only for 'assistant' messages.
        User messages are treated as plain text.
        Pass remarkGfm plugin for GitHub Flavored Markdown support.
      */}
      {isUser ? (
        message.content // Render user messages as plain text
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      )}
    </MessageBubble>
  );
}