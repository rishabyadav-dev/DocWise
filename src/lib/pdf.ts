import pdf from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
}

export function processPDFText(text: string) {
  if (!text.trim()) {
    throw new Error("No text found in PDF.");
  }

  const chunks = [];
  const paragraphs = text.split('\n\n');

  let currentChunk = "";
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    if (currentChunk.length + trimmedParagraph.length > 2000 && currentChunk) {
      chunks.push(...chunkText(currentChunk, 2000, 100));
      currentChunk = trimmedParagraph;
    } else {
      currentChunk += currentChunk ? "\n\n" + trimmedParagraph : trimmedParagraph;
    }
  }

  if (currentChunk) {
    chunks.push(...chunkText(currentChunk, 2000, 100));
  }

  return chunks;
}

function chunkText(text: string, maxLength = 2000, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxLength;

    if (end < text.length) {
      for (let i = end - 200; i < end; i++) {
        if (i > start && (text[i] === "." || text[i] === "!" || text[i] === "?")) {
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
