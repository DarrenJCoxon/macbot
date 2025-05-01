'use client';

import React, { useState, useRef, FormEvent, ChangeEvent } from 'react';
import styled from 'styled-components';

// --- Styled Components (with theme) ---
const UploaderContainer = styled.div`
  margin-top: 24px;
  padding: 20px;
  border: 1px solid ${props => props.theme?.colors?.border || '#59321f'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  background-color: ${props => props.theme?.colors?.backgroundDark || '#e8dfc2'};
  box-shadow: ${props => props.theme?.shadows?.medium || '0 4px 8px rgba(0, 0, 0, 0.2)'};
`;

const UploaderTitle = styled.h3`
  margin-bottom: 16px;
  color: ${props => props.theme?.colors?.primary || '#3a1e1c'};
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  font-size: 1.3rem;
`;

const UploadForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FileInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileInputLabel = styled.label`
  padding: 12px;
  background-color: ${props => props.theme?.colors?.background || '#f8f4e9'};
  border: 1px dashed ${props => props.theme?.colors?.border || '#59321f'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: ${props => props.theme?.fonts?.body || 'inherit'};
  color: ${props => props.theme?.colors?.text || '#2d2416'};
  
  &:hover {
    background-color: ${props => props.theme?.colors?.gold || '#c4a747'};
    color: ${props => props.theme?.colors?.primaryDark || '#2a1615'};
    border-color: ${props => props.theme?.colors?.primary || '#3a1e1c'};
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const MetadataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme?.colors?.primary || '#3a1e1c'};
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
`;

const TextInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme?.colors?.border || '#59321f'};
  border-radius: ${props => props.theme?.borderRadius?.small || '4px'};
  font-size: 14px;
  background-color: ${props => props.theme?.colors?.background || '#f8f4e9'};
  color: ${props => props.theme?.colors?.text || '#2d2416'};
  font-family: ${props => props.theme?.fonts?.body || 'inherit'};
  
  &:focus {
    border-color: ${props => props.theme?.colors?.secondary || '#473080'};
    outline: none;
    box-shadow: 0 0 0 2px rgba(71, 48, 128, 0.2);
  }
  
  &::placeholder {
    color: ${props => props.theme?.colors?.textLight || '#59463a'};
    font-style: italic;
  }
`;

const UploadButton = styled.button`
  background-color: ${props => props.theme?.colors?.secondary || '#473080'};
  color: white;
  border: 1px solid ${props => props.theme?.colors?.secondaryDark || '#2b1d4e'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.theme?.shadows?.small || '0 2px 4px rgba(0, 0, 0, 0.1)'};
  
  &:before {
    content: '📜';
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
  margin-top: 12px;
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

// --- Component Logic ---
interface DocumentMetadataForm {
  title: string;
  source: string;
  type: string;
}

export default function DocumentUploader() {
  // State for the selected file
  const [file, setFile] = useState<File | null>(null);
  // State for the metadata input fields
  const [metadata, setMetadata] = useState<DocumentMetadataForm>({
    title: '',
    source: '',
    type: 'notes', // Default type
  });
  // State for displaying status messages (success/error)
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  // State to manage the uploading process (disable button etc.)
  const [isUploading, setIsUploading] = useState(false);
  // Ref to access the hidden file input element (e.g., for resetting)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for when a file is selected
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    console.log("[DocumentUploader] handleFileChange: Selected file:", selectedFile);
    setFile(selectedFile);
    setStatus(null);

    if (selectedFile && !metadata.title) {
      const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      console.log(`[DocumentUploader] Auto-populating title: ${fileNameWithoutExt}`);
      setMetadata(prev => ({
        ...prev,
        title: fileNameWithoutExt,
      }));
    }
  };

  // Handler for changes in metadata text inputs
  const handleMetadataChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("[DocumentUploader] handleSubmit triggered.");

    if (!file) {
      console.log("[DocumentUploader] Validation failed: No file selected.");
      setStatus({ message: 'Please select a file to upload', isError: true });
      return;
    }
     if (!metadata.title.trim()) {
        console.log("[DocumentUploader] Validation failed: Document Title is required.");
        setStatus({ message: 'Document Title is required', isError: true });
        return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('metadata', JSON.stringify(metadata));
      console.log("[DocumentUploader] FormData prepared. Keys:", Array.from(formData.keys()));

      console.log("[DocumentUploader] Sending request to /api/admin/upload-document");
      const response = await fetch('/api/admin/upload-document', {
        method: 'POST',
        body: formData,
      });
      console.log(`[DocumentUploader] Received response with status: ${response.status}`);

      const data = await response.json();

      if (response.ok) {
        console.log("[DocumentUploader] Upload successful:", data);
        setStatus({ message: data.message || 'Document uploaded successfully!', isError: false });
        setFile(null);
        setMetadata({ title: '', source: '', type: 'notes' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        console.error("[DocumentUploader] Upload failed:", data);
        setStatus({ message: data.error || data.details || 'Failed to upload document', isError: true });
      }
    } catch (error) {
      console.error('[DocumentUploader] Error submitting document:', error);
      setStatus({ message: 'An unexpected network or client-side error occurred', isError: true });
    } finally {
      setIsUploading(false);
    }
  };

  // --- Component Render ---
  return (
    <UploaderContainer>
      <UploaderTitle>Upload Documents (Admin)</UploaderTitle>
      <UploadForm onSubmit={handleSubmit}>
        <FileInputContainer>
          <FileInputLabel htmlFor="admin-document-upload">
            {file ? `Selected: ${file.name}` : 'Click to select document (.txt, .pdf, .docx, .md)'}
          </FileInputLabel>
          <HiddenFileInput
            id="admin-document-upload"
            type="file"
            accept=".txt,.md,.pdf,.docx,.doc" // Updated to accept PDF and Word docs
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isUploading}
          />
        </FileInputContainer>

        <MetadataContainer>
          <InputLabel htmlFor="doc-title">Document Title</InputLabel>
          <TextInput
            id="doc-title"
            name="title"
            value={metadata.title}
            onChange={handleMetadataChange}
            placeholder="E.g., Macbeth Act 1 Analysis"
            required
            disabled={isUploading}
          />
        </MetadataContainer>

        <MetadataContainer>
          <InputLabel htmlFor="doc-source">Source (Optional)</InputLabel>
          <TextInput
            id="doc-source"
            name="source"
            value={metadata.source}
            onChange={handleMetadataChange}
            placeholder="E.g., Lecture Notes Week 5, Study Guide Chapter 3"
            disabled={isUploading}
          />
        </MetadataContainer>

        <UploadButton type="submit" disabled={isUploading || !file}>
          {isUploading ? 'Transcribing...' : 'Upload Document'}
        </UploadButton>

        {status && (
          <StatusMessage $isError={status.isError}>
            {status.message}
          </StatusMessage>
        )}
      </UploadForm>
    </UploaderContainer>
  );
}