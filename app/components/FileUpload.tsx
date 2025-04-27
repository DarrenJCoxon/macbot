import { useState } from 'react';
import styled from 'styled-components';

const UploadContainer = styled.div`
  margin-bottom: 24px;
`;

const UploadButton = styled.label`
  display: inline-block;
  background-color: var(--gray-200);
  color: var(--gray-800);
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--gray-300);
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
  background-color: var(--gray-100);
  border-radius: 4px;
  font-size: 14px;
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
  color: ${props => 
    props.$isSuccess ? 'green' : 
    props.$isError ? 'red' : 
    'var(--gray-800)'};
`;

type FileUploadProps = {
  onFileUpload: (files: File[]) => Promise<void>;
};

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File;
    status: 'uploading' | 'success' | 'error';
  }>>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const files = Array.from(e.target.files);
    
    // Update UI immediately
    setUploadedFiles(prev => [
      ...prev,
      ...files.map(file => ({ file, status: 'uploading' as const }))
    ]);
    
    try {
      // Handle the actual upload
      await onFileUpload(files);
      
      // Update status to success
      setUploadedFiles(prev => 
        prev.map(item => 
          files.some(f => f.name === item.file.name && f.size === item.file.size)
            ? { ...item, status: 'success' as const }
            : item
        )
      );
    } catch (error) {
      // Update status to error
      setUploadedFiles(prev => 
        prev.map(item => 
          files.some(f => f.name === item.file.name && f.size === item.file.size)
            ? { ...item, status: 'error' as const }
            : item
        )
      );
      console.error('File upload error:', error);
    }
  };

  return (
    <UploadContainer>
      <UploadButton htmlFor="file-upload">
        Upload Macbeth Documents
      </UploadButton>
      <HiddenInput
        id="file-upload"
        type="file"
        multiple
        accept=".pdf,.txt,.docx,.md"
        onChange={handleFileChange}
      />
      
      {uploadedFiles.length > 0 && (
        <FileList>
          {uploadedFiles.map((item, index) => (
            <FileItem key={`${item.file.name}-${index}`}>
              <FileName>{item.file.name}</FileName>
              <FileStatus
                $isSuccess={item.status === 'success'}
                $isError={item.status === 'error'}
              >
                {item.status === 'uploading' && 'Uploading...'}
                {item.status === 'success' && 'Uploaded'}
                {item.status === 'error' && 'Failed'}
              </FileStatus>
            </FileItem>
          ))}
        </FileList>
      )}
    </UploadContainer>
  );
}