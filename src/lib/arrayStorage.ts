// Array-based storage for RAG system
interface Chunk {
  id: string;
  text: string;
  embedding: number[];
  order: number;
  fileId: string;
}

interface File {
  id: string;
  name: string;
  userId: string;
  summary: string;
  chunks: Chunk[];
  createdAt: Date;
}

// In-memory storage arrays
const files: File[] = [];
const chunks: Chunk[] = [];

let nextFileId = 1;
let nextChunkId = 1;

export class ArrayStorage {
  // File operations
  static createFile(data: {
    name: string;
    userId: string;
    summary: string;
    chunks: Array<{
      text: string;
      embedding: number[];
      order: number;
    }>;
  }): File {
    const fileId = nextFileId++;
    const fileChunks: Chunk[] = data.chunks.map((chunkData, index) => ({
      id: `chunk_${nextChunkId++}`,
      text: chunkData.text,
      embedding: chunkData.embedding,
      order: chunkData.order,
      fileId: `file_${fileId}`,
    }));

    const file: File = {
      id: `file_${fileId}`,
      name: data.name,
      userId: data.userId,
      summary: data.summary,
      chunks: fileChunks,
      createdAt: new Date(),
    };

    files.push(file);
    chunks.push(...fileChunks);

    return file;
  }

  static getFileById(fileId: string, userId: string): File | null {
    const file = files.find(f => f.id === fileId && f.userId === userId);
    if (!file) return null;

    // Get chunks for this file
    const fileChunks = chunks.filter(c => c.fileId === fileId);
    return {
      ...file,
      chunks: fileChunks.sort((a, b) => a.order - b.order),
    };
  }

  static getFilesByUserId(userId: string): File[] {
    return files.filter(f => f.userId === userId);
  }

  static deleteFile(fileId: string, userId: string): boolean {
    const fileIndex = files.findIndex(f => f.id === fileId && f.userId === userId);
    if (fileIndex === -1) return false;

    // Remove chunks for this file
    const chunkIndices = chunks
      .map((chunk, index) => chunk.fileId === fileId ? index : -1)
      .filter(index => index !== -1)
      .reverse(); // Reverse to avoid index shifting issues

    chunkIndices.forEach(index => chunks.splice(index, 1));

    // Remove file
    files.splice(fileIndex, 1);
    return true;
  }

  // Chunk operations
  static getChunksByFileId(fileId: string): Chunk[] {
    return chunks
      .filter(c => c.fileId === fileId)
      .sort((a, b) => a.order - b.order);
  }

  static getAllChunks(): Chunk[] {
    return [...chunks];
  }

  // Utility methods
  static clearAll(): void {
    files.length = 0;
    chunks.length = 0;
    nextFileId = 1;
    nextChunkId = 1;
  }

  static getStats(): { fileCount: number; chunkCount: number } {
    return {
      fileCount: files.length,
      chunkCount: chunks.length,
    };
  }
}

export type { File, Chunk };
