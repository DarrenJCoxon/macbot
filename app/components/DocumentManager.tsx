// app/components/DocumentManager.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// --- Styled Components ---
// Using styles similar to DocumentUploader for consistency
const ManagerContainer = styled.div`
  margin-top: 24px; // Match DocumentUploader margin-top
  padding: 20px;
  border: 1px solid ${props => props.theme?.colors?.border || '#59321f'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  background-color: ${props => props.theme?.colors?.backgroundDark || '#e8dfc2'};
  box-shadow: ${props => props.theme?.shadows?.medium || '0 4px 8px rgba(0, 0, 0, 0.2)'};
  font-family: ${props => props.theme?.fonts?.body || 'inherit'};
  color: ${props => props.theme?.colors?.text || '#2d2416'};
  // Ensure it can shrink if needed in flex layout
  min-width: 0;
`;

const ManagerTitle = styled.h3`
  margin-bottom: 16px;
  color: ${props => props.theme?.colors?.primary || '#3a1e1c'};
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  font-size: 1.3rem;
`;

const DocumentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px; // Limit height and allow scrolling
  overflow-y: auto;
  border: 1px solid ${props => props.theme?.colors?.border || '#59321f'};
  border-radius: ${props => props.theme?.borderRadius?.small || '4px'};
  background-color: ${props => props.theme?.colors?.background || '#f8f4e9'};

  /* Custom scrollbar for theme */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme?.colors?.border || '#59321f'};
    border-radius: 10px;
  }
`;

const DocumentItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${props => props.theme?.colors?.border || '#59321f'};

  &:last-child {
    border-bottom: none;
  }
`;

const DocumentDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin-right: 1rem;
  min-width: 0; // Allow shrinking
`;

const DocumentFileName = styled.span`
  font-weight: 500;
  color: ${props => props.theme?.colors?.primaryDark || '#2a1615'};
  word-break: break-all; // Allow long filenames to wrap
`;

const DocumentInfo = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme?.colors?.textLight || '#59463a'};
  margin-top: 2px;
`;

const DeleteButton = styled.button`
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
  background-color: ${props => props.theme?.colors?.error || '#911f1c'};
  border: 1px solid ${props => props.theme?.colors?.primaryDark || '#2a1615'};
  color: white;
  border-radius: ${props => props.theme?.borderRadius?.small || '4px'};
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  flex-shrink: 0; // Prevent button from shrinking

  &:hover:not(:disabled) {
    background-color: #6d3935; // Darker red on hover
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RefreshButton = styled(DeleteButton)` // Re-use some button styles
    background-color: ${props => props.theme?.colors?.secondary || '#473080'};
    border: 1px solid ${props => props.theme?.colors?.secondaryDark || '#2b1d4e'};
    margin-top: 1rem;

    &:hover:not(:disabled) {
        background-color: ${props => props.theme?.colors?.secondaryLight || '#6a52a2'};
    }
`;

const StatusMessage = styled.p<{ $isError?: boolean }>`
  margin-top: 12px;
  padding: 8px 12px;
  background-color: ${props => props.$isError
    ? 'rgba(145, 31, 28, 0.1)'
    : 'rgba(42, 76, 52, 0.1)'};
  color: ${props => props.$isError
    ? props.theme?.colors?.error || '#911f1c'
    : props.theme?.colors?.success || '#2a4c34'};
  border-radius: ${props => props.theme?.borderRadius?.small || '4px'};
  border-left: 3px solid ${props => props.$isError
    ? props.theme?.colors?.error || '#911f1c'
    : props.theme?.colors?.success || '#2a4c34'};
  font-family: ${props => props.theme?.fonts?.body || 'inherit'};
  font-style: italic;
  font-size: 0.9rem;
  word-break: break-word;
`;

const LoadingText = styled.p`
    font-style: italic;
    color: ${props => props.theme?.colors?.textLight || '#59463a'};
`;


// --- Component Logic ---

interface DocumentInfo {
  fileName: string;
  uploadedAt?: string; // Assuming API returns this (optional)
  chunks: number;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  // Track which specific file is being deleted to disable only that button
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Function to fetch documents from the API
  const fetchDocuments = useCallback(async () => {
    console.log("[DocumentManager] Fetching documents...");
    setIsLoading(true);
    setStatus(null); // Clear previous status
    setDeletingFile(null); // Clear any previous deletion state
    try {
      const response = await fetch('/api/documents'); // Use the GET endpoint
      const data = await response.json();

      if (!response.ok) {
        console.error("[DocumentManager] Fetch failed:", data);
        throw new Error(data.details || data.error || `Failed to fetch documents: ${response.statusText}`);
      }
      console.log("[DocumentManager] Documents received:", data.documents);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("[DocumentManager] Error fetching documents:", error);
      setStatus({ message: error instanceof Error ? error.message : 'Failed to load documents', isError: true });
      setDocuments([]); // Clear documents on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function doesn't change

  // Fetch documents when the component mounts
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]); // Include fetchDocuments in dependency array

  // Function to handle the delete action
  const handleDelete = async (fileName: string) => {
    // User confirmation
    if (!window.confirm(`Are you sure you want to delete all data for "${fileName}" from the knowledge base? This action cannot be undone.`)) {
      return;
    }

    console.log(`[DocumentManager] Attempting to delete: ${fileName}`);
    setDeletingFile(fileName); // Set which file is being deleted (for UI feedback)
    setStatus(null); // Clear previous status

    try {
      const response = await fetch('/api/documents', { // Use the DELETE endpoint
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }), // Send fileName in the body
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error("[DocumentManager] Delete failed:", data);
        throw new Error(data.details || data.error || `Failed to delete ${fileName}`);
      }

      console.log("[DocumentManager] Deletion successful:", data);
      setStatus({ message: data.message || `Successfully deleted ${fileName}`, isError: false });
      // Refresh the list automatically after successful deletion
      await fetchDocuments();

    } catch (error) {
      console.error("[DocumentManager] Error deleting document:", error);
      setStatus({ message: error instanceof Error ? error.message : `Failed to delete ${fileName}`, isError: true });
    } finally {
        setDeletingFile(null); // Reset deletion indicator regardless of success/failure
    }
  };

  // --- Component Render ---
  return (
    <ManagerContainer>
      <ManagerTitle>Uploaded Documents</ManagerTitle>

      {/* Status Message Display */}
      {status && (
        <StatusMessage $isError={status.isError}>
          {status.message}
        </StatusMessage>
      )}

      {/* Loading Indicator */}
      {isLoading && !status && <LoadingText>Loading documents...</LoadingText>}

      {/* Document List */}
      {!isLoading && documents.length > 0 && (
        <DocumentList>
          {documents.map((doc) => (
            <DocumentItem key={doc.fileName}>
              <DocumentDetails>
                <DocumentFileName title={doc.fileName}>{doc.fileName}</DocumentFileName>
                <DocumentInfo>({doc.chunks} chunks indexed)</DocumentInfo>
              </DocumentDetails>
              <DeleteButton
                onClick={() => handleDelete(doc.fileName)}
                disabled={deletingFile === doc.fileName || isLoading} // Disable while this file is deleting or list is loading
              >
                {deletingFile === doc.fileName ? 'Deleting...' : 'Delete'}
              </DeleteButton>
            </DocumentItem>
          ))}
        </DocumentList>
      )}

      {/* Message when no documents are loaded */}
      {!isLoading && documents.length === 0 && !status?.isError && (
        <p>No documents found in the knowledge base.</p>
      )}

      {/* Manual Refresh Button */}
       <RefreshButton onClick={fetchDocuments} disabled={isLoading || !!deletingFile}>
           {isLoading ? 'Refreshing...' : 'Refresh List'}
       </RefreshButton>

    </ManagerContainer>
  );
}