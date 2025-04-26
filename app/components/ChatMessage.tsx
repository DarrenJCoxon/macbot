'use client';

import { Message } from '@/app/types';
import { MessageBubble } from '@/app/styles/ChatStyles';

type ChatMessageProps = {
  message: Message;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <MessageBubble $isUser={isUser}>
      {message.content}
    </MessageBubble>
  );
}