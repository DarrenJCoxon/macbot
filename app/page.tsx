// app/page.tsx
'use client';

import Chat from './components/Chat';
// Removed AdminPanel, DocumentUploader, useState, Link imports
// Removed styled-components import if ToggleButton/AdminSection were the only users

// Removed ToggleButton and AdminSection styled components

export default function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-4xl"> {/* Removed relative positioning if AdminLink is gone */}
        {/* Removed AdminLink */}
        <h1 className="text-4xl font-bold text-center mb-6">Macbot</h1>
        <h2 className="text-xl text-center mb-10">Your AI Shakespeare Study Assistant</h2>

        {/* Only the Chat component remains */}
        <Chat />

        {/* Removed Admin Panel toggle and section */}
      </div>
    </main>
  );
}