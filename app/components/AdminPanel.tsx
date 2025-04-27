'use client';

import React, { useState } from 'react';
import styled from 'styled-components';

const AdminContainer = styled.div`
  margin-top: 40px;
  padding: 20px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
`;

const AdminTitle = styled.h3`
  margin-bottom: 16px;
  color: var(--gray-800);
`;

const AdminButton = styled.button`
  background-color: #4a4a4a;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #333;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.p<{ $isError?: boolean }>`
  margin-top: 16px;
  color: ${props => props.$isError ? 'red' : 'green'};
`;

export default function AdminPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  
  const seedDatabase = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setStatus('Seeding database with Macbeth content...');
    setIsError(false);
    
    try {
      // Get admin API key from environment or prompt user
      const adminApiKey = prompt('Enter admin API key:');
      
      if (!adminApiKey) {
        setStatus('Seeding cancelled');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminApiKey}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data.message || 'Successfully seeded database!');
        setIsError(false);
      } else {
        setStatus(`Error: ${data.error || 'Failed to seed database'}`);
        setIsError(true);
      }
    } catch (error) {
      console.error('Error seeding database:', error);
      setStatus('An unexpected error occurred while seeding the database.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AdminContainer>
      <AdminTitle>Admin Panel</AdminTitle>
      <AdminButton 
        onClick={seedDatabase}
        disabled={isLoading}
      >
        {isLoading ? 'Seeding...' : 'Seed Pinecone Database'}
      </AdminButton>
      
      {status && (
        <StatusMessage $isError={isError}>
          {status}
        </StatusMessage>
      )}
    </AdminContainer>
  );
}