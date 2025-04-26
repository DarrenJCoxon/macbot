'use client';

import { FormEvent } from 'react';
import { 
  InputForm, 
  InputContainer, 
  TextInput, 
  SendButton 
} from '@/app/styles/ChatStyles';

type ChatInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
};

export default function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading 
}: ChatInputProps) {
  return (
    <InputForm onSubmit={onSubmit}>
      <InputContainer>
        <TextInput
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Ask about Macbeth..."
          disabled={isLoading}
        />
        <SendButton 
          type="submit" 
          disabled={isLoading || !value.trim()}
        >
          Send
        </SendButton>
      </InputContainer>
    </InputForm>
  );
}