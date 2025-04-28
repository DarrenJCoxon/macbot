// app/components/ChatInput.tsx
'use client';

import { FormEvent } from 'react';
import { 
  InputForm, 
  InputContainer, 
  TextInput, 
  SendButton 
} from '@/app/styles/ChatStyles';
import styled from 'styled-components';

// Add decoration to the send button
const StylizedSendButton = styled(SendButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:before {
    content: '✒️';
    margin-right: 0.5rem;
  }
`;

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
          placeholder="Pose thy query about Macbeth..."
          disabled={isLoading}
        />
        <StylizedSendButton 
          type="submit" 
          disabled={isLoading || !value.trim()}
        >
          Dispatch
        </StylizedSendButton>
      </InputContainer>
    </InputForm>
  );
}