"use client";
import { useUploadedStore } from "@/store/uploadStore";
import { motion } from "motion/react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import InputBox from "./inputBox";

export default function AnswerViewArea() {
  const uploaded = useUploadedStore((state) => state.uploaded);

  const [answer, setAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const askQuestion = async (question: string) => {
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
    uploaded && (
      <div className=" flex flex-col  ">
        <motion.div className="text-black h-[80vh] bg-slate-50 max-w-6xl  mx-auto rounded-lg ">
          <div className="h-full  overflow-y-auto scrollbar-thin text-xl p-8 border-2 rounded-lg pr-2">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
          {isStreaming && (
            <span className="animate-pulse text-xl font-bold ml-1">|</span>
          )}
        </motion.div>

        <div className="  ">
          <div className="max-w-3xl mx-auto  ">
            <InputBox askQuestion={askQuestion} />
          </div>
        </div>
      </div>
    )
  );
}
