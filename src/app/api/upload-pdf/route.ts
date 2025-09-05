import { auth } from "@/auth";
import { ArrayStorage } from "@/lib/arrayStorage";
import { chunkText, encodeTexts } from "@/lib/embeddings";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Convert buffer to base64 for attachment
    const base64Data = buffer.toString("base64");

    if (!base64Data || base64Data.length === 0) {
      throw new Error("Failed to convert PDF buffer to base64");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const contents = [
      {
        text: "Extract all the text content from this PDF document. Return only the plain text without any markdown formatting or additional commentary. Include all text from every page.",
      },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    return response.text || "";
  } catch (error) {
    console.error("Google Gemini PDF processing error:", error);
    throw new Error(
      `Failed to process PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

let currentGeminiIndex = 0;

async function generateGeminiText(prompt: string, maxTokens = 2000) {
  for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
    try {
      const modelName = GEMINI_MODELS[currentGeminiIndex];
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ text: prompt }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: maxTokens,
        },
      } as any);

      if (response.text) {
        return response.text.trim();
      }
    } catch (error: any) {
      if (
        error.message?.includes("429") ||
        error.message?.includes("Too Many Requests")
      ) {
        currentGeminiIndex = (currentGeminiIndex + 1) % GEMINI_MODELS.length;
        continue;
      } else {
        return `Error generating response: ${error.message}`;
      }
    }
  }
  return "All Gemini models are currently rate-limited or unavailable.";
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth();
    if (!user?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const allText = await extractTextFromPDF(Buffer.from(buffer));

    if (!allText.trim()) {
      return NextResponse.json({
        num_chunks: 0,
        error: "No text found in PDF.",
      });
    }

    const chunks = [];
    const paragraphs = allText.split("\n\n");

    let currentChunk = "";
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      if (
        currentChunk.length + trimmedParagraph.length > 2000 &&
        currentChunk
      ) {
        chunks.push(...chunkText(currentChunk, 2000, 100));
        currentChunk = trimmedParagraph;
      } else {
        currentChunk += currentChunk
          ? "\n\n" + trimmedParagraph
          : trimmedParagraph;
      }
    }

    if (currentChunk) {
      chunks.push(...chunkText(currentChunk, 2000, 100));
    }

    const embeddings = await encodeTexts(chunks);

    const context = chunks.slice(0, 5).join("\n");
    const summaryPrompt = `Provide a clear, concise 2 sentence summary of this document:\n\n${context}`;
    const summary = await generateGeminiText(summaryPrompt, 150);

    const questionsPrompt = `Generate exactly 5 simple questions about this document. Return only the questions as plain text, one per line, no formatting, no numbers:\n\n${context}`;
    const questionsText = await generateGeminiText(questionsPrompt, 200);
    const questionsList = questionsText
      .split("\n")
      .map((q: string) => q.trim())
      .filter((q: string) => q && q.includes("?"))
      .slice(0, 5);

    const fileRecord = ArrayStorage.createFile({
      name: file.name,
      userId: user.user.id,
      summary,
      chunks: chunks.map((chunk, index) => ({
        text: chunk,
        embedding: embeddings[index],
        order: index,
      })),
    });

    return NextResponse.json({
      num_chunks: chunks.length,
      summary,
      suggested_questions: questionsList,
      fileId: fileRecord.id,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
