import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Write file to temporary directory
 */
export async function writeFileToTemp(
  buffer: ArrayBuffer, 
  filename: string
): Promise<string> {
  // Create a temporary directory
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'macbot-upload-')
  );
  
  // Create file path
  const filePath = path.join(tempDir, filename);
  
  // Write the file
  await fs.writeFile(
    filePath, 
    Buffer.from(buffer)
  );
  
  return filePath;
}

/**
 * Clean up temporary file
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    // Check if the file exists
    await fs.access(filePath);
    
    // Delete the file
    await fs.unlink(filePath);
    
    // Try to remove the directory
    const dirPath = path.dirname(filePath);
    await fs.rmdir(dirPath);
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
    // Continue even if cleanup fails
  }
}

/**
 * Parse text file
 */
export async function parseTextFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error parsing text file:', error);
    throw new Error('Failed to parse text file');
  }
}

/**
 * Detect file type from extension and parse accordingly
 */
export async function parseFile(
  buffer: ArrayBuffer,
  filename: string
): Promise<string> {
  // Get file extension
  const ext = path.extname(filename).toLowerCase();
  
  // Write to temp file
  const filePath = await writeFileToTemp(buffer, filename);
  
  try {
    // Process based on file type
    if (ext === '.txt') {
      return await parseTextFile(filePath);
    } else {
      // For now, only support .txt
      // In a full implementation, add support for .pdf, .docx, etc.
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } finally {
    // Clean up temp file
    await cleanupTempFile(filePath);
  }
}