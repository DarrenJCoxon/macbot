// app/components/FileUpload.tsx
import { useState } from 'react';
import styled from 'styled-components';

// --- Styled Components (No Changes) ---
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

  // --- File Input Change Handler (with added logging) ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // --- Debug Log 1: Function Entry ---
    console.log('[FileUpload.tsx] handleFileChange triggered.');

    // --- Debug Log 2: Check if files exist in event ---
    if (!e.target.files || e.target.files.length === 0) {
      console.log('[FileUpload.tsx] No files selected in input event.');
      // Consider clearing the UI list if the user cancels selection
      // setUploadedFiles([]);
      return; // Exit if no files selected
    }

    // --- Debug Log 3: Log the raw FileList and converted Array ---
    console.log('[FileUpload.tsx] e.target.files (FileList):', e.target.files);
    const files = Array.from(e.target.files); // Convert FileList to Array
    console.log('[FileUpload.tsx] Files obtained from event target (Array):', files);
    if (files.length > 0) {
         files.forEach((f, i) => console.log(`[FileUpload.tsx] File ${i}: ${f.name}, Size: ${f.size}, Type: ${f.type}`));
    } else {
         console.log('[FileUpload.tsx] FileList conversion resulted in empty array.');
         return; // Exit if conversion fails
    }
    // --- End Debug Log 3 ---


    // Update UI immediately to show "uploading" state for the newly selected files
    // This approach appends new selections to the list.
    // To replace previous selections, use: setUploadedFiles(files.map(...));
    const newUploadingFiles = files.map(file => ({ file, status: 'uploading' as const }));
    setUploadedFiles(prev => [...prev, ...newUploadingFiles]);
    console.log('[FileUpload.tsx] Updated UI state to show newly selected files as uploading.');


    try {
      // --- Debug Log 4: Before calling parent's handler ---
      console.log('[FileUpload.tsx] Calling onFileUpload prop function with validated files array:', files);
      // --- End Debug Log 4 ---

      // Call the asynchronous function passed from the parent (Chat.tsx)
      // This function contains the logic to actually send files to the server
      await onFileUpload(files);

      // --- Debug Log 5: After parent function returns successfully ---
      console.log('[FileUpload.tsx] onFileUpload prop function completed successfully.');
      // --- End Debug Log 5 ---

      // Update status to 'success' for the files that were just processed
      // This logic finds the items just added (matching name/size) and marks them successful
      setUploadedFiles(prev =>
        prev.map(item =>
             files.some(f => f.name === item.file.name && f.size === item.file.size) && item.status === 'uploading'
            ? { ...item, status: 'success' as const }
            : item
        )
      );
    } catch (error) {
       // --- Debug Log 6: If parent function throws an error ---
      console.error('[FileUpload.tsx] Error caught after calling onFileUpload:', error);
       // --- End Debug Log 6 ---

      // Update status to 'error' for the files that were just processed
      setUploadedFiles(prev =>
        prev.map(item =>
            files.some(f => f.name === item.file.name && f.size === item.file.size) && item.status === 'uploading'
            ? { ...item, status: 'error' as const }
            : item
        )
      );
      // Error is logged here, and potentially also in Chat.tsx if thrown there
    } finally {
        // Reset the file input value. This allows selecting the same file again
        // immediately after an upload attempt (success or failure).
        if (e.target) {
            e.target.value = '';
            console.log('[FileUpload.tsx] File input value reset.');
        }
    }
  }; // --- End handleFileChange ---


  // --- Component Render ---
  return (
    <UploadContainer>
      {/* The label acts as the clickable button, linked to the hidden input */}
      <UploadButton htmlFor="file-upload">
        Upload Macbeth Documents
      </UploadButton>

      {/* The actual file input element, hidden from view */}
      <HiddenInput
        id="file-upload" // Matches the label's htmlFor
        type="file"
        multiple // Allows selection of multiple files
        accept=".pdf,.txt,.docx,.md" // Specifies allowed file types
        onChange={handleFileChange} // Calls the handler when files are selected
      />

      {/* Display the list of files and their status */}
      {uploadedFiles.length > 0 && (
        <FileList>
          {uploadedFiles.map((item, index) => (
            // Use a more robust key including status to help React differentiate
            <FileItem key={`${item.file.name}-${index}-${item.status}`}>
              {/* Show filename, add title attribute for full name on hover */}
              <FileName title={item.file.name}>{item.file.name}</FileName>
              {/* Display the status (uploading, success, error) */}
              <FileStatus
                $isSuccess={item.status === 'success'}
                $isError={item.status === 'error'}
              >
                {item.status === 'uploading' && 'Uploading...'}
                {item.status === 'success' && 'Processed'} {/* Updated label */}
                {item.status === 'error' && 'Failed'}
              </FileStatus>
            </FileItem>
          ))}
        </FileList>
      )}
    </UploadContainer>
  );
} // --- End Component Definition ---