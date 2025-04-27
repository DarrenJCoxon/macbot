// app/admin/page.tsx
'use client'; // Needed because AdminPanel and DocumentUploader likely use hooks

import React from 'react';
import Link from 'next/link'; // Optional: for linking back
import AdminPanel from '@/app/components/AdminPanel'; // Adjust path if needed
import DocumentUploader from '@/app/components/DocumentUploader'; // Adjust path if needed
import styled from 'styled-components'; // Optional: for styling

// Optional basic styling for the admin page container
const AdminPageContainer = styled.div`
  padding: 2rem;
  max-width: 900px;
  margin: 2rem auto;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  background-color: var(--background); // Use theme variable
`;

const AdminPageTitle = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: bold;
`;

const BackLink = styled(Link)`
    display: block;
    margin-bottom: 2rem;
    color: var(--primary);
    text-decoration: underline;
    &:hover {
        color: var(--primary-hover);
    }
`;


export default function AdminPage() {
  return (
    <AdminPageContainer>
        <BackLink href="/">← Back to Chat</BackLink>
      <AdminPageTitle>Admin Area</AdminPageTitle>

      {/* Render the Admin Panel (Seeding) */}
      <AdminPanel />

      <hr style={{ margin: '2rem 0', borderColor: 'var(--gray-200)' }} />

      {/* Render the Document Uploader (Detailed Upload Form) */}
      <DocumentUploader />

    </AdminPageContainer>
  );
}