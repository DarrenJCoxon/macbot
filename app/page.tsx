// app/page.tsx
'use client';

import Chat from './components/Chat';
import styled from 'styled-components';
import Link from 'next/link'; // Import Link

// Styled component for the Admin Link
const AdminLink = styled(Link)`
  position: absolute; // Position relative to the parent div
  top: 1rem;          // Adjust spacing from top
  right: 1rem;         // Adjust spacing from right
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: var(--gray-800);
  background-color: var(--gray-100);
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--gray-200);
    color: var(--foreground); // Ensure text color remains readable
  }

  // Adjust positioning for smaller screens if needed
  @media (max-width: 600px) {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.4rem 0.8rem;
  }
`;


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      {/* Make the main content container relatively positioned for the absolute link */}
      <div className="w-full max-w-4xl relative"> {/* Added relative positioning */}
        {/* Add the Admin Link */}
        <AdminLink href="/admin">
           Admin Panel
        </AdminLink>

        <h1 className="text-4xl font-bold text-center mb-6">Macbot</h1>
        <h2 className="text-xl text-center mb-10">Your AI Shakespeare Study Assistant</h2>

        <Chat />

      </div>
    </main>
  );
}