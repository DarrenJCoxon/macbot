// app/page.tsx
'use client';

import Chat from './components/Chat';
import Link from 'next/link';
import styled from 'styled-components';

// Add padding and dramatic styling to the main container
const PageContainer = styled.main`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: ${props => props.theme?.colors?.background || 'var(--background)'};
  background-image: url('/parchment-bg.png');
  background-size: cover;
  background-attachment: fixed;
  position: relative; /* Add position relative for absolute positioning inside */
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  position: relative;
  margin: 2rem auto;
`;

// Redesigned admin button with more prominent styling
const AdminButton = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  
  a {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1rem;
    background-color: ${props => props.theme?.colors?.backgroundDark || '#e8dfc2'};
    color: ${props => props.theme?.colors?.primary || '#3a1e1c'};
    font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
    font-weight: 500;
    font-size: 0.9rem;
    border: 1px solid ${props => props.theme?.colors?.border || '#59321f'};
    border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
    text-decoration: none;
    box-shadow: ${props => props.theme?.shadows?.small || '0 2px 4px rgba(0, 0, 0, 0.1)'};
    transition: all 0.2s ease;
    
    &:before {
      content: '✒️';
      margin-right: 0.5rem;
      font-size: 1.2rem;
    }
    
    &:hover {
      background-color: ${props => props.theme?.colors?.gold || '#c4a747'};
      border-color: ${props => props.theme?.colors?.primaryDark || '#2a1615'};
      color: ${props => props.theme?.colors?.primaryDark || '#2a1615'};
      box-shadow: ${props => props.theme?.shadows?.medium || '0 4px 8px rgba(0, 0, 0, 0.2)'};
      transform: translateY(-2px);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: ${props => props.theme?.shadows?.small || '0 2px 4px rgba(0, 0, 0, 0.1)'};
    }
  }
`;

// Dramatic heading styles
const Title = styled.h1`
  text-align: center;
  font-size: 3rem;
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  color: ${props => props.theme?.colors?.primary || 'var(--foreground)'};
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  
  &:before, &:after {
    content: '✧';
    font-size: 2rem;
    margin: 0 1rem;
    color: ${props => props.theme?.colors?.gold || '#c4a747'};
    vertical-align: middle;
  }
`;

const Subtitle = styled.h2`
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 2rem;
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  font-style: italic;
  color: ${props => props.theme?.colors?.textLight || 'var(--foreground)'};
  
  &:before, &:after {
    content: '~';
    margin: 0 0.5rem;
    color: ${props => props.theme?.colors?.secondary || 'var(--primary)'};
  }
`;

const Flourish = styled.div`
  text-align: center;
  margin: 1rem 0;
  font-size: 1.5rem;
  color: ${props => props.theme?.colors?.gold || '#c4a747'};
`;

export default function Home() {
  return (
    <PageContainer>
      <AdminButton>
        <Link href="/admin">Scribe&apos;s Chambers</Link>
      </AdminButton>
      
      <ContentWrapper>
        <Title>The Macbeth Oracle</Title>
        <Subtitle>A Digital Companion for the Scottish Play</Subtitle>
        
        <Flourish>❦ ❦ ❦</Flourish>
        
        <Chat />
        
        <Flourish>❦ ❦ ❦</Flourish>
      </ContentWrapper>
    </PageContainer>
  );
}