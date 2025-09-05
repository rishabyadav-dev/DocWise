import { CohereClient } from 'cohere-ai';

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || '',
});

export interface TokenizeResponse {
  tokens: number[];
  tokenStrings: string[];
}

export interface EmbedResponse {
  embeddings: number[][];
  meta: {
    api_version: {
      version: string;
    };
    billed_units: {
      input_tokens: number;
    };
  };
}

/**
 * Tokenize text using Cohere's tokenizer
 * @param text - Text to tokenize
 * @param model - Model to use for tokenization (default: 'command')
 * @returns Tokenized representation
 */
export async function tokenizeText(text: string, model: string = 'command'): Promise<TokenizeResponse> {
  try {
    const response = await cohere.tokenize({
      text,
      model,
    });
    
    return {
      tokens: response.tokens,
      tokenStrings: response.tokenStrings,
    };
  } catch (error) {
    console.error('Cohere tokenization error:', error);
    throw new Error('Failed to tokenize text with Cohere');
  }
}

/**
 * Generate embeddings for texts using Cohere's embedder
 * @param texts - Array of texts to embed
 * @param model - Model to use for embeddings (default: 'embed-english-v3.0')
 * @param inputType - Type of input (default: 'search_document')
 * @returns Embeddings array
 */
export async function generateEmbeddings(
  texts: string[],
  model: string = 'embed-english-v3.0',
  inputType: 'search_document' | 'search_query' | 'classification' | 'clustering' = 'search_document'
): Promise<number[][]> {
  try {
    const response = await cohere.embed({
      texts,
      model,
      inputType,
    });
    
    return response.embeddings as number[][];
  } catch (error) {
    console.error('Cohere embedding error:', error);
    throw new Error('Failed to generate embeddings with Cohere');
  }
}

/**
 * Generate embeddings for a single text
 * @param text - Text to embed
 * @param model - Model to use for embeddings
 * @param inputType - Type of input
 * @returns Single embedding vector
 */
export async function generateSingleEmbedding(
  text: string,
  model: string = 'embed-english-v3.0',
  inputType: 'search_document' | 'search_query' | 'classification' | 'clustering' = 'search_document'
): Promise<number[]> {
  const embeddings = await generateEmbeddings([text], model, inputType);
  return embeddings[0];
}

/**
 * Calculate cosine similarity between two vectors
 * @param vectorA - First vector
 * @param vectorB - Second vector
 * @returns Cosine similarity score
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Find most similar chunks based on embeddings
 * @param queryEmbedding - Query embedding vector
 * @param chunks - Array of chunks with embeddings
 * @param topK - Number of top results to return
 * @returns Array of similar chunks with similarity scores
 */
export function findSimilarChunks(
  queryEmbedding: number[],
  chunks: Array<{ text: string; embedding: number[]; [key: string]: any }>,
  topK: number = 7
): Array<{ similarity: number; chunk: any }> {
  const similarities = chunks.map(chunk => ({
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    chunk,
  }));
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
