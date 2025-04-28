// app/styles/ChatStyles.ts
'use client';

import styled from 'styled-components';

// Main container for the entire chat interface
export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid ${props => props.theme?.colors?.border || 'var(--gray-300)'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  overflow: hidden;
  background-color: ${props => props.theme?.colors?.background || 'var(--background)'};
  box-shadow: ${props => props.theme?.shadows?.medium || '0 4px 8px rgba(0, 0, 0, 0.2)'};
  font-family: ${props => props.theme?.fonts?.body || 'inherit'};
  position: relative;
  
  /* Decorative corner flourishes */
  &:before, &:after {
    content: '❦';
    position: absolute;
    color: ${props => props.theme?.colors?.gold || '#c4a747'};
    font-size: 1.5rem;
    opacity: 0.7;
  }
  
  &:before {
    top: 10px;
    left: 10px;
  }
  
  &:after {
    bottom: 10px;
    right: 10px;
  }
`;

// Container for the scrollable list of messages
export const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: ${props => props.theme?.colors?.background || 'var(--background)'};
  background-image: linear-gradient(
    rgba(248, 244, 233, 0.7), 
    rgba(248, 244, 233, 0.7)
  );
  
  /* Custom scrollbar for theme */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme?.colors?.backgroundDark || 'var(--gray-100)'};
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme?.colors?.border || 'var(--gray-300)'};
    border-radius: 20px;
  }
`;

// Individual message bubble styling
export const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: ${props => props.$isUser 
    ? `${props.theme?.borderRadius?.large || '8px'} ${props.theme?.borderRadius?.large || '8px'} 0 ${props.theme?.borderRadius?.large || '8px'}`
    : `${props.theme?.borderRadius?.large || '8px'} ${props.theme?.borderRadius?.large || '8px'} ${props.theme?.borderRadius?.large || '8px'} 0`
  };
  align-self: ${props => (props.$isUser ? 'flex-end' : 'flex-start')};
  
  /* Different styling for user vs assistant */
  background-color: ${props => props.$isUser 
    ? (props.theme?.colors?.primary || 'var(--primary)') 
    : (props.theme?.colors?.backgroundDark || 'var(--gray-200)')
  };
  color: ${props => props.$isUser 
    ? 'white'
    : (props.theme?.colors?.text || 'var(--gray-800)')
  };
  
  /* Parchment effect for the assistant's messages */
  ${props => !props.$isUser && `
    border: 1px solid ${props.theme?.colors?.border || '#d1c4a1'};
    box-shadow: ${props.theme?.shadows?.small || '0 2px 4px rgba(0, 0, 0, 0.1)'};
    position: relative;
    
    &:after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, transparent 50%, rgba(209, 196, 161, 0.3) 50%);
      border-radius: 0 0 ${props.theme?.borderRadius?.large || '8px'} 0;
    }
  `}
  
  /* User message styling */
  ${props => props.$isUser && `
    box-shadow: ${props.theme?.shadows?.small || '0 2px 4px rgba(0, 0, 0, 0.1)'};
  `}
  
  /* Markdown elements styling */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 0.8em;
    margin-bottom: 0.4em;
    font-weight: 600;
    line-height: 1.3;
    color: inherit;
    font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  h1 { font-size: 1.4em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.2em; }

  p {
    margin-bottom: 0.8em;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* Lists */
  ul, ol {
    margin-bottom: 0.8em;
    padding-left: 1.5em;
  }

  li {
    margin-bottom: 0.3em;
  }

  /* Inline Code */
  code {
    background-color: ${props => props.$isUser 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'rgba(0, 0, 0, 0.08)'
    };
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: ${props => props.theme?.fonts?.mono || 'var(--font-geist-mono, Consolas, Monaco, monospace)'};
  }
  
  /* Code Blocks */
  pre {
    background-color: ${props => props.theme?.colors?.backgroundDark || 'var(--gray-100)'};
    color: ${props => props.theme?.colors?.text || 'var(--gray-800)'};
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5em 0 1em 0;
    font-size: 0.9em;
    line-height: 1.4;

    code {
      background-color: transparent;
      padding: 0;
      color: inherit;
      font-size: inherit;
      border-radius: 0;
    }
  }

  /* Links */
  a {
    color: ${props => props.$isUser 
      ? '#bbe1fa' 
      : (props.theme?.colors?.secondary || 'var(--primary)')
    };
    text-decoration: underline;
    
    &:hover {
      color: ${props => props.$isUser 
        ? '#d6edff' 
        : (props.theme?.colors?.secondaryLight || 'var(--primary-hover)')
      };
    }
  }

  /* Blockquotes - styled as theatrical asides */
  blockquote {
    border-left: 3px solid ${props => props.$isUser 
      ? 'rgba(255, 255, 255, 0.5)' 
      : (props.theme?.colors?.secondary || 'var(--gray-300)')
    };
    padding-left: 1em;
    margin-left: 0;
    margin-bottom: 0.8em;
    color: inherit;
    opacity: 0.9;
    font-style: italic;
    
    &:before {
      content: '"';
      font-size: 1.2em;
      margin-right: 0.2em;
    }
    
    &:after {
      content: '"';
      font-size: 1.2em;
      margin-left: 0.2em;
    }
  }

  /* Tables */
  table {
    border-collapse: collapse;
    margin-bottom: 1em;
    width: 100%;
    font-size: 0.9em;
    border: 1px solid ${props => props.theme?.colors?.border || 'var(--gray-300)'};
  }
  
  th, td {
    border: 1px solid ${props => props.theme?.colors?.border || 'var(--gray-300)'};
    padding: 0.5em 0.7em;
    text-align: left;
  }
  
  th {
    background-color: ${props => props.theme?.colors?.backgroundDark || 'var(--gray-100)'};
    font-weight: 600;
  }

  /* Horizontal Rules - styled as decorative dividers */
  hr {
    border: none;
    border-top: 1px solid ${props => props.$isUser 
      ? 'rgba(255, 255, 255, 0.3)' 
      : (props.theme?.colors?.border || 'var(--gray-300)')
    };
    margin: 1em 0;
    position: relative;
    
    &:after {
      content: '❦';
      position: absolute;
      top: -0.7em;
      left: 50%;
      transform: translateX(-50%);
      background: ${props => props.$isUser 
        ? props.theme?.colors?.primary || 'var(--primary)'
        : props.theme?.colors?.backgroundDark || 'var(--gray-200)'
      };
      padding: 0 0.5em;
      color: ${props => props.$isUser 
        ? 'rgba(255, 255, 255, 0.7)' 
        : (props.theme?.colors?.gold || 'var(--gray-800)')
      };
      font-size: 0.8em;
    }
  }
`;

// Form container at the bottom for input
export const InputForm = styled.form`
  border-top: 1px solid ${props => props.theme?.colors?.border || 'var(--gray-300)'};
  padding: 16px;
  background-color: ${props => props.theme?.colors?.backgroundDark || 'var(--background)'};
`;

// Flex container for the text input and send button
export const InputContainer = styled.div`
  display: flex;
  gap: 8px;
`;

// Text input field styling
export const TextInput = styled.input`
  flex: 1;
  padding: 8px 16px;
  border: 1px solid ${props => props.theme?.colors?.border || 'var(--gray-300)'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  font-size: 1rem;
  outline: none;
  background-color: ${props => props.theme?.colors?.background || 'var(--background)'};
  color: ${props => props.theme?.colors?.text || 'var(--foreground)'};
  font-family: ${props => props.theme?.fonts?.body || 'inherit'};

  &:focus {
    border-color: ${props => props.theme?.colors?.secondary || 'var(--primary)'};
    box-shadow: 0 0 0 2px rgba(71, 48, 128, 0.2);
  }

  &:disabled {
    background-color: ${props => props.theme?.colors?.backgroundDark || 'var(--gray-100)'};
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  &::placeholder {
    color: ${props => props.theme?.colors?.textLight || 'var(--gray-800)'};
    font-style: italic;
  }
`;

// Send button styling
export const SendButton = styled.button`
  background-color: ${props => props.theme?.colors?.primary || 'var(--primary)'};
  color: white;
  border: none;
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  padding: 8px 16px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};

  &:hover:not(:disabled) {
    background-color: ${props => props.theme?.colors?.primaryLight || 'var(--primary-hover)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Add quill icon */
  &:before {
    content: '✒️';
    margin-right: 0.5rem;
  }
`;

// Loading indicator styling with a quill animation
export const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  color: ${props => props.theme?.colors?.textLight || 'var(--gray-800)'};
  font-style: italic;
  font-size: 0.9em;
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  
  &:before {
    content: "The Oracle ponders";
    margin-right: 0.5rem;
  }

  /* Quill pen animation */
  &:after {
    content: "✒️";
    display: inline-block;
    animation: quillWrite 1.8s infinite;
    transform-origin: bottom;
  }

  @keyframes quillWrite {
    0% { transform: rotate(-5deg); }
    25% { transform: rotate(10deg); }
    50% { transform: rotate(-5deg); }
    75% { transform: rotate(10deg); }
    100% { transform: rotate(-5deg); }
  }
`;

// Additional decorative components
export const Flourish = styled.div`
  text-align: center;
  margin: 1rem 0;
  font-size: 1.5rem;
  color: ${props => props.theme?.colors?.gold || '#c4a747'};
`;

export const PageContainer = styled.main`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: ${props => props.theme?.colors?.background || 'var(--background)'};
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
  color: ${props => props.theme?.colors?.primary || 'var(--foreground)'};
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  
  &:before, &:after {
    content: '✧';
    font-size: 2rem;
    margin: 0 1rem;
    color: ${props => props.theme?.colors?.gold || '#c4a747'};
    vertical-align: middle;
  }
`;

export const PageSubtitle = styled.h2`
  font-size: 1.25rem;
  text-align: center;
  margin-bottom: 32px;
  color: ${props => props.theme?.colors?.textLight || 'var(--gray-800)'};
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  font-style: italic;
  
  &:before, &:after {
    content: '~';
    margin: 0 0.5rem;
    color: ${props => props.theme?.colors?.secondary || 'var(--primary)'};
  }
`;