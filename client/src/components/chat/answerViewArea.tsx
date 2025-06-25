"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import InputBox from "./inputBox";

export default function AnswerViewArea() {
  const [answer, setAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const askQuestion = async (question) => {
    if (!question.trim()) return;

    setAnswer("");
    setIsStreaming(true);

    try {
      const formData = new FormData();
      formData.append("question", question);

      const response = await fetch("http://localhost:8000/ask/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              setIsStreaming(false);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setAnswer((prev) => prev + parsed.content);
              } else if (parsed.error) {
                setAnswer((prev) => prev + `\n\nError: ${parsed.error}`);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
              console.log("Parse error for:", data);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setAnswer("Error occurred while streaming response");
    } finally {
      setIsStreaming(false);
    }
  };
  return (
    <div className="flex-1 flex flex-col min-h-0 justify-end">
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        <div className="max-w-7xl mx-auto bg-gray-400/50 rounded-2xl p-7 mt-12">
          <div className="text-black text-xl">
            <ReactMarkdown>{answer}</ReactMarkdown>
            {isStreaming && (
              <span className="animate-pulse text-xl font-bold ml-1">|</span>
            )}
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 left-0  right-0 px-4 pb-4  z-10">
        <div className="max-w-3xl mx-auto  ">
          <InputBox askQuestion={askQuestion} />
        </div>
      </div>
    </div>
  );
}
