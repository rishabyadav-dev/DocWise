import {
  cosineSimilarity,
  findSimilarChunks,
  generateEmbeddings,
  generateSingleEmbedding,
} from "./cohere";

// Legacy function for backward compatibility
export async function initializeEmbedder() {
  // No initialization needed for Cohere API
  return Promise.resolve();
}

// Updated to use Cohere API with proper batching
export async function encodeTexts(texts: string[], batchSize = 96) {
  if (typeof texts === "string") {
    texts = [texts];
  }

  try {
    const allEmbeddings: number[][] = [];
    
    // Process texts in batches to respect Cohere's 96 text limit
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const batchEmbeddings = await generateEmbeddings(
        batch,
        "embed-english-v3.0",
        "search_document"
      );
      
      allEmbeddings.push(...batchEmbeddings);
    }
    
    return allEmbeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}

// New function for single text embedding
export async function encodeText(text: string) {
  try {
    return await generateSingleEmbedding(
      text,
      "embed-english-v3.0",
      "search_document"
    );
  } catch (error) {
    console.error("Error generating single embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

// Export Cohere utilities for use in other parts of the app
export { cosineSimilarity, findSimilarChunks };

export function chunkText(text: string, maxLength = 2000, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxLength;

    if (end < text.length) {
      for (let i = end - 200; i < end; i++) {
        if (
          i > start &&
          (text[i] === "." || text[i] === "!" || text[i] === "?")
        ) {
          end = i + 1;
          break;
        }
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    start = end - overlap;
  }

  return chunks;
}

export function ensureCodeBlockSpacing(text: string): string {
  text = text.replace(/[ \t]*```/g, "\n```\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/([^\n])\n```/g, "$1\n\n```");
  text = text.replace(/```\n([^\n])/g, "```\n\n$1");
  return text;
}
