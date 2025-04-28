// app/admin/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import DocumentUploader from '@/app/components/DocumentUploader';
import styled from 'styled-components';

const AdminPageContainer = styled.div`
  padding: 2rem;
  max-width: 900px;
  margin: 2rem auto;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  background-color: ${props => props.theme.colors.background};
  background-image: url('/parchment-bg.png');
  background-size: cover;
  box-shadow: ${props => props.theme.shadows.large};
`;

const AdminPageTitle = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  font-family: ${props => props.theme.fonts.heading};
  
  &:before, &:after {
    content: '❦';
    margin: 0 1rem;
    color: ${props => props.theme.colors.gold};
  }
`;

const BackLink = styled(Link)`
    display: block;
    margin-bottom: 2rem;
    color: ${props => props.theme.colors.secondary};
    text-decoration: none;
    font-family: ${props => props.theme.fonts.heading};
    font-style: italic;
    
    &:before {
      content: '←';
      margin-right: 0.5rem;
    }
    
    &:hover {
        color: ${props => props.theme.colors.secondaryLight};
        text-decoration: underline;
    }
`;

export default function AdminPage() {
  return (
    <AdminPageContainer>
        <BackLink href="/">Return to the Oracle</BackLink>
        <AdminPageTitle>The Scribe&apos;s Chambers</AdminPageTitle>

        {/* Document Uploader */}
        <DocumentUploader />
    </AdminPageContainer>
  );
}