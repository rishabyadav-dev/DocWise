import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
];

let currentGeminiIndex = 0;

export function getGeminiModel() {
  const modelName = GEMINI_MODELS[currentGeminiIndex];
  console.log(`Using Gemini model: ${modelName}`);
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({ model: modelName });
}

export function rotateGeminiModel() {
  currentGeminiIndex = (currentGeminiIndex + 1) % GEMINI_MODELS.length;
}

export async function generateGeminiText(prompt: string, maxTokens = 2000) {
  for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
    const model = getGeminiModel();
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: maxTokens,
        },
      });
      
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        return text.trim();
      }
    } catch (error: any) {
      if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
        rotateGeminiModel();
        continue;
      } else {
        return `Error generating response: ${error.message}`;
      }
    }
  }
  return "All Gemini models are currently rate-limited or unavailable.";
}

export async function* streamGeminiResponse(prompt: string) {
  for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
    const model = getGeminiModel();
    try {
      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
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
      if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
        rotateGeminiModel();
        continue;
      } else {
        yield `data: ${JSON.stringify({ error: error.message })}\n\n`;
        yield `data: [DONE]\n\n`;
        return;
      }
    }
  }
  yield `data: ${JSON.stringify({ error: 'All Gemini models are rate-limited or unavailable.' })}\n\n`;
  yield `data: [DONE]\n\n`;
}