import { auth } from "@/auth";
import { ArrayStorage } from "@/lib/arrayStorage";
import { encodeTexts, findSimilarChunks } from "@/lib/embeddings";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
];

let currentGeminiIndex = 0;

function getGeminiModel() {
  const modelName = GEMINI_MODELS[currentGeminiIndex];
  console.log(`Using Gemini model: ${modelName}`);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({ model: modelName });
}

function ensureCodeBlockSpacing(text: string): string {
  text = text.replace(/[ \t]*```/g, "\n```\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/([^\n])\n```/g, "$1\n\n```");
  text = text.replace(/```\n([^\n])/g, "```\n\n$1");
  return text;
}

async function* streamGeminiResponse(prompt: string) {
  for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
    const model = getGeminiModel();
    try {
      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
        },
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield `data: ${JSON.stringify({ content: chunkText })}\n\n`;
        }
      }

      yield `data: [DONE]\n\n`;
      return;
    } catch (error: any) {
      if (
        error.message?.includes("429") ||
        error.message?.includes("Too Many Requests")
      ) {
        currentGeminiIndex = (currentGeminiIndex + 1) % GEMINI_MODELS.length;
        continue;
      } else {
        yield `data: ${JSON.stringify({
          error: `Error generating response: ${error.message}`,
        })}\n\n`;
        yield `data: [DONE]\n\n`;
        return;
      }
    }
  }
  yield `data: ${JSON.stringify({
    error: "All Gemini models are rate-limited or unavailable.",
  })}\n\n`;
  yield `data: [DONE]\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth();
    if (!user?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const question = formData.get("question") as string;
    const fileId = formData.get("fileId") as string;

    if (!question || !fileId) {
      console.error("Missing question or fileId");
      return new Response("Missing question or fileId", { status: 400 });
    }

    const file = ArrayStorage.getFileById(fileId, user.user.id);

    if (!file) {
      console.error("File not found for fileId:", fileId);
      return new Response("File not found", { status: 404 });
    }

    if (!file.chunks.length) {
      console.error("No chunks found in file");
      return new Response("No PDF uploaded yet. Please upload a PDF first.", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // Generate question embedding using Cohere API
    const questionEmbedding = await encodeTexts([question]);
    const questionVector = questionEmbedding[0];

    // Use the new findSimilarChunks function for better similarity calculation
    const chunksWithEmbeddings = file.chunks.filter(
      (chunk: any) => chunk.embedding
    );

    const similarChunks = findSimilarChunks(
      questionVector,
      chunksWithEmbeddings,
      7
    );
    const bestChunks = similarChunks.map((s) => s.chunk);
    const context = bestChunks.map((c) => c.text).join("\n");

    const today = new Date().toISOString().split("T")[0];

    const prompt = `# 📝 Expert Document Analyst

➡️ **Answer the user's question strictly using only the provided PDF context.**
🚫 *Do NOT include any information not present in the context.*

---
## ✨ Formatting Guidelines
- Write concisely and get straight to the point
- Use markdown headings (## for main sections, ### for subsections)
- Use **bold** for key terms and emphasis
- Keep your response focused, maximum 2000 tokens
- Use bullet points (•) for lists - keep them short and impactful
- Use numbered lists (1., 2., 3.) for step-by-step processes
- For math, use LaTeX: inline as $...$ or display as $$...$$
- Include relevant examples from the context when helpful
- Write in clear, professional paragraphs without excessive spacing
- For code blocks: Start with \`\`\` on its own line, add language, then code, then \`\`\` on its own line
- Avoid redundant information and filler text
- Use section breaks strategically, not excessively
- Add relevant emojis sparingly to highlight key points

---
## 📄 Context
${context}

## ❓ Question
${question}

---
💡 *Provide a well-structured, concise answer that maximizes information density while remaining clear and professional.*`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamGeminiResponse(prompt)) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      `Internal server error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}
