// app/components/FileUpload.tsx
'use client';

import { useState } from 'react';
import styled from 'styled-components';

// --- Styled Components with Shakespearean theme ---
const UploadContainer = styled.div`
  margin-bottom: 24px;
`;

const UploadButton = styled.label`
  display: inline-block;
  background-color: ${props => props.theme?.colors?.backgroundDark || 'var(--gray-200)'};
  color: ${props => props.theme?.colors?.text || 'var(--gray-800)'};
  border: 1px solid ${props => props.theme?.colors?.border || 'var(--gray-300)'};
  border-radius: ${props => props.theme?.borderRadius?.medium || '8px'};
  padding: 8px 16px;
  font-size: 14px;
  font-family: ${props => props.theme?.fonts?.heading || 'inherit'};
  cursor: pointer;
  transition: all 0.2s;
  
  /* Add a scroll icon */
  &:before {
    content: '📜';
    margin-right: 0.5rem;
  }
  
  &:hover {
    background-color: ${props => props.theme?.colors?.secondary || 'var(--gray-300)'};
    color: white;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const FileList = styled.ul`
  list-style: none;
  margin-top: 12px;
  padding: 0;
`;

const FileItem = styled.li`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: ${props => props.theme?.colors?.backgroundDark || 'var(--gray-100)'};
  border: 1px solid ${props => props.theme?.colors?.border || 'var(--gray-300)'};
  border-radius: ${props => props.theme?.borderRadius?.small || '4px'};
  font-size: 14px;
  font-family: ${props => props.theme?.fonts?.body || 'inherit'};
`;

const FileName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FileStatus = styled.span<{ $isSuccess?: boolean; $isError?: boolean }>`
  margin-left: 8px;
  font-size: 12px;
  font-style: italic;
  color: ${props =>
    props.$isSuccess ? (props.theme?.colors?.success || 'green') :
    props.$isError ? (props.theme?.colors?.error || 'red') :
    (props.theme?.colors?.textLight || 'var(--gray-800)')};
`;
// --- End Styled Components ---


// --- Component Props ---
type FileUploadProps = {
  // Function passed from parent to handle the files once selected
  onFileUpload: (files: File[]) => Promise<void>;
};


// --- Component Definition ---
export default function FileUpload({ onFileUpload }: FileUploadProps) {
  // State to manage the list of files shown in the UI and their status
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File;
    status: 'uploading' | 'success' | 'error';
  }>>([]);

  // --- File Input Change Handler - Keeping all logging as is ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[FileUpload.tsx] handleFileChange triggered.');

    if (!e.target.files || e.target.files.length === 0) {
      console.log('[FileUpload.tsx] No files selected in input event.');
      return;
    }

    console.log('[FileUpload.tsx] e.target.files (FileList):', e.target.files);
    const files = Array.from(e.target.files);
    console.log('[FileUpload.tsx] Files obtained from event target (Array):', files);
    if (files.length > 0) {
         files.forEach((f, i) => console.log(`[FileUpload.tsx] File ${i}: ${f.name}, Size: ${f.size}, Type: ${f.type}`));
    } else {
         console.log('[FileUpload.tsx] FileList conversion resulted in empty array.');
         return;
    }

    const newUploadingFiles = files.map(file => ({ file, status: 'uploading' as const }));
    setUploadedFiles(prev => [...prev, ...newUploadingFiles]);
    console.log('[FileUpload.tsx] Updated UI state to show newly selected files as uploading.');

    try {
      console.log('[FileUpload.tsx] Calling onFileUpload prop function with validated files array:', files);
      await onFileUpload(files);
      console.log('[FileUpload.tsx] onFileUpload prop function completed successfully.');

      setUploadedFiles(prev =>
        prev.map(item =>
             files.some(f => f.name === item.file.name && f.size === item.file.size) && item.status === 'uploading'
            ? { ...item, status: 'success' as const }
            : item
        )
      );
    } catch (error) {
      console.error('[FileUpload.tsx] Error caught after calling onFileUpload:', error);

      setUploadedFiles(prev =>
        prev.map(item =>
            files.some(f => f.name === item.file.name && f.size === item.file.size) && item.status === 'uploading'
            ? { ...item, status: 'error' as const }
            : item
        )
      );
    } finally {
        if (e.target) {
            e.target.value = '';
            console.log('[FileUpload.tsx] File input value reset.');
        }
    }
  };

  // --- Component Render ---
  return (
    <UploadContainer>
      {/* The label text is updated, but ID remains the same */}
      <UploadButton htmlFor="file-upload">
        Consult Ancient Texts (.txt, .pdf, .docx)
      </UploadButton>

      {/* Keep all properties the same */}
      <HiddenInput
        id="file-upload"
        type="file"
        multiple
        accept=".pdf,.txt,.docx,.doc,.md"
        onChange={handleFileChange}
      />

      {/* Update status text to be more Shakespearean */}
      {uploadedFiles.length > 0 && (
        <FileList>
          {uploadedFiles.map((item, index) => (
            <FileItem key={`${item.file.name}-${index}-${item.status}`}>
              <FileName title={item.file.name}>{item.file.name}</FileName>
              <FileStatus
                $isSuccess={item.status === 'success'}
                $isError={item.status === 'error'}
              >
                {item.status === 'uploading' && 'Transcribing...'}
                {item.status === 'success' && 'Inscribed'} 
                {item.status === 'error' && 'Misfortune!'}
              </FileStatus>
            </FileItem>
          ))}
        </FileList>
      )}
    </UploadContainer>
  );
}