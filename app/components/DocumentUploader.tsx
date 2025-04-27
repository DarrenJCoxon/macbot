'use client';

import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const UploaderContainer = styled.div`
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
`;

const UploaderTitle = styled.h3`
  margin-bottom: 16px;
  color: var(--gray-800);
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
  background-color: var(--gray-100);
  border: 1px dashed var(--gray-300);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--gray-200);
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
  color: var(--gray-800);
`;

const TextInput = styled.input`
  padding: 8px 12px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    border-color: var(--primary);
    outline: none;
  }
`;

const UploadButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.p<{ $isError?: boolean }>`
  margin-top: 12px;
  padding: 8px 12px;
  background-color: ${props => props.$isError ? '#fee2e2' : '#ecfdf5'};
  color: ${props => props.$isError ? '#b91c1c' : '#047857'};
  border-radius: 6px;
  font-size: 14px;
`;

const SelectedFileName = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: var(--gray-800);
`;

interface DocumentMetadata {
  title: string;
  source: string;
  type: string;
}

export default function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    title: '',
    source: '',
    type: 'notes', // Default type
  });
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Reset status when a new file is selected
    setStatus(null);
    
    // Auto-populate title from filename if empty
    if (selectedFile && !metadata.title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove file extension
      setMetadata(prev => ({
        ...prev,
        title: fileName,
      }));
    }
  };
  
  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setStatus({
        message: 'Please select a file to upload',
        isError: true,
      });
      return;
    }
    
    // Check file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'txt') {
      setStatus({
        message: 'Only .txt files are supported at this time',
        isError: true,
      });
      return;
    }
    
    setIsUploading(true);
    setStatus(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));
      
      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus({
          message: data.message || 'Document uploaded and processed successfully!',
          isError: false,
        });
        
        // Reset form
        setFile(null);
        setMetadata({
          title: '',
          source: '',
          type: 'notes',
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setStatus({
          message: data.error || 'Failed to upload document',
          isError: true,
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setStatus({
        message: 'An unexpected error occurred',
        isError: true,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <UploaderContainer>
      <UploaderTitle>Upload Documents</UploaderTitle>
      <UploadForm onSubmit={handleSubmit}>
        <FileInputContainer>
          <FileInputLabel htmlFor="document-upload">
            {file ? 'Change selected file' : 'Click to select a file (.txt only)'}
          </FileInputLabel>
          <HiddenFileInput
            id="document-upload"
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          {file && <SelectedFileName>{file.name}</SelectedFileName>}
        </FileInputContainer>
        
        <MetadataContainer>
          <InputLabel htmlFor="title">Document Title</InputLabel>
          <TextInput
            id="title"
            name="title"
            value={metadata.title}
            onChange={handleMetadataChange}
            placeholder="E.g., Macbeth Analysis"
            required
          />
        </MetadataContainer>
        
        <MetadataContainer>
          <InputLabel htmlFor="source">Source</InputLabel>
          <TextInput
            id="source"
            name="source"
            value={metadata.source}
            onChange={handleMetadataChange}
            placeholder="E.g., Lecture Notes, Study Guide"
          />
        </MetadataContainer>
        
        <UploadButton type="submit" disabled={isUploading || !file}>
          {isUploading ? 'Uploading...' : 'Upload Document'}
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