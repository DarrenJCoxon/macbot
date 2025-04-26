import styled from 'styled-components';

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  overflow: hidden;
`;

export const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 8px;
  align-self: ${props => (props.$isUser ? 'flex-end' : 'flex-start')};
  background-color: ${props => (props.$isUser ? 'var(--primary)' : 'var(--gray-200)')};
  color: ${props => (props.$isUser ? '#fff' : 'var(--gray-800)')};
`;

export const InputForm = styled.form`
  border-top: 1px solid var(--gray-300);
  padding: 16px;
`;

export const InputContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const TextInput = styled.input`
  flex: 1;
  padding: 8px 16px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  
  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
  
  &:disabled {
    background-color: var(--gray-100);
    cursor: not-allowed;
  }
`;

export const SendButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  color: var(--gray-800);
  
  &::after {
    content: "...";
    animation: ellipsis 1.5s infinite;
  }
  
  @keyframes ellipsis {
    0% {
      content: ".";
    }
    33% {
      content: "..";
    }
    66% {
      content: "...";
    }
  }
`;

export const PageContainer = styled.main`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

export const ContentContainer = styled.div`
  width: 100%;
  max-width: 800px;
`;

export const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
`;

export const PageSubtitle = styled.h2`
  font-size: 1.25rem;
  text-align: center;
  margin-bottom: 32px;
  color: var(--gray-800);
`;