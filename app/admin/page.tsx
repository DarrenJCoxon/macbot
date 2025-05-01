// app/admin/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import DocumentUploader from '@/app/components/DocumentUploader';
import DocumentManager from '@/app/components/DocumentManager'; // 1. Import the new component
import styled from 'styled-components';

const AdminPageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px; // 4. Increased max-width for two columns
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

// 2. --- New Layout Container ---
const AdminContentLayout = styled.div`
  display: flex;
  flex-direction: row; // Arrange children side-by-side
  gap: 2rem;          // Space between columns
  flex-wrap: wrap;    // Allow wrapping on smaller screens if needed

  // Adjust column width distribution
  & > * { // Target direct children (DocumentUploader and DocumentManager)
     flex: 1; // Assign equal flexible space initially
     min-width: 350px; // Ensure columns don't get too narrow before wrapping
  }

  @media (max-width: 900px) { // Adjusted breakpoint for better responsiveness
      flex-direction: column; // Stack columns on smaller screens
  }
`;
// --- End New Layout Container ---

export default function AdminPage() {
  return (
    <AdminPageContainer>
        <BackLink href="/">Return to the Oracle</BackLink>
        <AdminPageTitle>The Scribe&apos;s Chambers</AdminPageTitle>

        {/* 3. Use the new layout container */}
        <AdminContentLayout>
            {/* Left Column: Document Uploader */}
            <DocumentUploader />

            {/* Right Column: Document Manager */}
            <DocumentManager />
        </AdminContentLayout>

    </AdminPageContainer>
  );
}