// app/styles/ChatStyles.ts
import styled from 'styled-components';

// Main container for the entire chat interface
export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 600px; /* Adjust height as needed, or use flex-grow in a container */
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  overflow: hidden; /* Contains scrolling within MessagesList */
  background-color: var(--background); /* Use theme background */
`;

// Container for the scrollable list of messages
export const MessagesList = styled.div`
  flex: 1; /* Allows this area to grow and fill available space */
  overflow-y: auto; /* Enables vertical scrolling */
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* Space between message bubbles */
`;

// Individual message bubble styling
export const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%; /* Prevent bubbles from taking full width */
  padding: 12px 16px;
  border-radius: 8px;
  /* Align user messages to the right, assistant to the left */
  align-self: ${props => (props.$isUser ? 'flex-end' : 'flex-start')};
  /* Different background colors for user and assistant */
  background-color: ${props => (props.$isUser ? 'var(--primary)' : 'var(--gray-200)')};
  /* Different text colors */
  color: ${props => (props.$isUser ? '#fff' : 'var(--foreground)')}; /* Use theme foreground for assistant */
  line-height: 1.6; /* Improve readability */
  word-wrap: break-word; /* Ensure long words wrap */

  /* --- Styles for Markdown Elements (Primarily for Assistant Messages) --- */
  /* Apply these styles to all bubbles, or target assistant specifically */
  /* Example targeting only assistant: &:not([data-is-user="true"]) { ... } */

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 0.8em;
    margin-bottom: 0.4em;
    font-weight: 600;
    line-height: 1.3;
    /* Clear margin for the very first heading in a bubble */
    &:first-child {
      margin-top: 0;
    }
  }
  h1 { font-size: 1.4em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.2em; }

  /* Paragraphs */
  p {
    margin-bottom: 0.8em;
    /* Remove margin from the last paragraph in a bubble */
    &:last-child {
      margin-bottom: 0;
    }
  }

  /* Lists (Unordered and Ordered) */
  ul, ol {
    margin-bottom: 0.8em;
    padding-left: 1.5em; /* Indent lists */
  }

  li {
    margin-bottom: 0.3em;
  }

  /* Inline Code */
  code {
    /* Use semi-transparent background based on text color */
    background-color: ${props => (props.$isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)')};
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: var(--font-geist-mono, Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace);
    word-break: break-word;
  }

  /* Code Blocks */
  pre {
    background-color: var(--gray-100); /* Use theme variable */
    color: var(--gray-800); /* Ensure text is visible */
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto; /* Allow horizontal scroll */
    margin: 0.5em 0 1em 0;
    font-size: 0.9em;
    line-height: 1.4;

    /* Reset inline code style when inside a pre block */
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
    color: ${props => (props.$isUser ? '#bbe1fa' : 'var(--primary)')}; /* Lighter blue for user, primary for assistant */
    text-decoration: underline;
    &:hover {
      /* Slightly adjust hover color based on user/assistant */
      color: ${props => (props.$isUser ? '#d6edff' : 'var(--primary-hover)')};
    }
  }

  /* Blockquotes */
  blockquote {
    border-left: 3px solid ${props => (props.$isUser ? 'rgba(255, 255, 255, 0.5)' : 'var(--gray-300)')};
    padding-left: 1em;
    margin-left: 0;
    margin-bottom: 0.8em;
    color: inherit; /* Inherit bubble text color */
    opacity: 0.9;
    font-style: italic;
  }

  /* Tables */
  table {
    border-collapse: collapse;
    margin-bottom: 1em;
    width: 100%; /* Or max-width depending on preference */
    font-size: 0.9em;
    border: 1px solid var(--gray-300); /* Add outer border */
  }
  th, td {
    border: 1px solid var(--gray-300);
    padding: 0.5em 0.7em;
    text-align: left;
  }
  th {
    background-color: var(--gray-100); /* Use theme variable */
    font-weight: 600;
  }

  /* Horizontal Rules */
  hr {
      border: none;
      border-top: 1px solid ${props => (props.$isUser ? 'rgba(255, 255, 255, 0.3)' : 'var(--gray-300)')};
      margin: 1em 0;
  }
  /* --- End Markdown Styles --- */
`;

// Form container at the bottom for input
export const InputForm = styled.form`
  border-top: 1px solid var(--gray-300);
  padding: 16px;
  background-color: var(--background); /* Match chat container background */
`;

// Flex container for the text input and send button
export const InputContainer = styled.div`
  display: flex;
  gap: 8px; /* Space between input and button */
`;

// Text input field styling
export const TextInput = styled.input`
  flex: 1; /* Take up remaining space */
  padding: 8px 16px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  background-color: var(--background); /* Ensure background matches */
  color: var(--foreground); /* Ensure text color matches */

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2); /* Focus indicator */
  }

  &:disabled {
    background-color: var(--gray-100);
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

// Send button styling
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

// Loading indicator styling (e.g., "Macbot is thinking...")
export const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  color: var(--gray-800); /* Use theme variable */
  font-style: italic;
  font-size: 0.9em;

  /* Ellipsis animation */
  &::after {
    content: "...";
    display: inline-block; /* Needed for animation */
    overflow: hidden; /* Hide dots initially */
    vertical-align: bottom; /* Align dots nicely */
    animation: ellipsis 1.5s infinite steps(3, end); /* Use steps */
    width: 1.2em; /* Adjust width to fit dots */
    text-align: left; /* Keep dots aligned left */
  }

  @keyframes ellipsis {
     0% { width: 0.3em; } /* One dot */
     33% { width: 0.6em; } /* Two dots */
     66% { width: 1em; } /* Three dots */
     100% { width: 0.3em; } /* Back to one */
  }
`;


// --- Optional Page/Layout Styles (if this file is used for more than just chat components) ---

// Example main page container
export const PageContainer = styled.main`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Center content vertically */
  padding: 16px; /* Add some padding */
`;

// Example content wrapper to constrain width
export const ContentContainer = styled.div`
  width: 100%;
  max-width: 800px; /* Example max width */
  /* Add margin if needed */
`;

// Example page title styling
export const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
`;

// Example page subtitle styling
export const PageSubtitle = styled.h2`
  font-size: 1.25rem;
  text-align: center;
  margin-bottom: 32px;
  color: var(--gray-800); /* Use theme variable */
`;