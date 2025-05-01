'use client';

import React, { useState } from 'react';
import styled from 'styled-components';

const AdminContainer = styled.div`
  margin-top: 40px;
  padding: 20px;
  border: 1px solid ${props => props.theme?.colors?.border || '#59321f'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  background-color: ${props => props.theme?.colors?.backgroundDark || '#e8dfc2'};
  box-shadow: ${props => props.theme?.shadows?.medium || '0 4px 8px rgba(0, 0, 0, 0.2)'};
  position: relative;
  
  /* Decorative corner curl */
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, transparent 50%, rgba(89, 50, 31, 0.2) 50%);
    border-radius: 0 0 ${props => props.theme?.borderRadius?.medium || '8px'} 0;
  }
`;

const AdminTitle = styled.h3`
  margin-bottom: 16px;
  color: ${props => props.theme?.colors?.primary || '#3a1e1c'};
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  font-size: 1.3rem;
  
  &:before, &:after {
    content: '❦';
    margin: 0 0.5rem;
    color: ${props => props.theme?.colors?.gold || '#c4a747'};
    font-size: 0.9rem;
    vertical-align: middle;
  }
`;

const AdminButton = styled.button`
  background-color: ${props => props.theme?.colors?.secondary || '#473080'};
  color: white;
  border: 1px solid ${props => props.theme?.colors?.secondaryDark || '#2b1d4e'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  padding: 8px 16px;
  font-size: 0.9rem;
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.theme?.shadows?.small || '0 2px 4px rgba(0, 0, 0, 0.1)'};
  
  &:before {
    content: '✒️';
    margin-right: 0.5rem;
  }
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme?.colors?.secondaryLight || '#6a52a2'};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme?.shadows?.medium || '0 4px 8px rgba(0, 0, 0, 0.2)'};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.p<{ $isError?: boolean }>`
  margin-top: 16px;
  padding: 8px 12px;
  background-color: ${props => props.$isError 
    ? 'rgba(145, 31, 28, 0.1)' // Light red background based on theme.colors.error
    : 'rgba(42, 76, 52, 0.1)'}; // Light green background based on theme.colors.success
  color: ${props => props.$isError 
    ? props.theme?.colors?.error || '#911f1c' 
    : props.theme?.colors?.success || '#2a4c34'};
  border-radius: ${props => props.theme?.borderRadius?.small || '4px'};
  border-left: 3px solid ${props => props.$isError 
    ? props.theme?.colors?.error || '#911f1c' 
    : props.theme?.colors?.success || '#2a4c34'};
  font-family: ${props => props.theme?.fonts?.body || 'inherit'};
  font-style: italic;
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