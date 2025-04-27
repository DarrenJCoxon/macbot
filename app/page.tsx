'use client';

import { useState } from 'react';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';
import styled from 'styled-components';

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: var(--gray-800);
  font-size: 0.8rem;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 20px;
  padding: 4px 8px;
  
  &:hover {
    color: var(--primary);
  }
`;

export default function Home() {
  const [showAdmin, setShowAdmin] = useState(false);
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-6">Macbot</h1>
        <h2 className="text-xl text-center mb-10">Your AI Shakespeare Study Assistant</h2>
        <Chat />
        
        <div className="flex justify-center">
          <ToggleButton onClick={() => setShowAdmin(!showAdmin)}>
            {showAdmin ? 'Hide Admin Panel' : 'Show Admin Panel'}
          </ToggleButton>
        </div>
        
        {showAdmin && <AdminPanel />}
      </div>
    </main>
  );
}