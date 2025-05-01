import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

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
 * Parse PDF file
 */
export async function parsePdfFile(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Parse DOCX file
 */
export async function parseDocxFile(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX file:', error);
    throw new Error('Failed to parse DOCX file');
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
    if (ext === '.txt' || ext === '.md') {
      return await parseTextFile(filePath);
    } else if (ext === '.pdf') {
      return await parsePdfFile(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      return await parseDocxFile(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } finally {
    // Clean up temp file
    await cleanupTempFile(filePath);
  }
}