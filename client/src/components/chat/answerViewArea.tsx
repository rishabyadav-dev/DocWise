"use client";
import { useIsStreamingStore, useUploadedStore } from "@/store/uploadStore";
import axios from "axios";
import "katex/dist/katex.min.css";
import { motion } from "motion/react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import InputBox from "./inputBox";

export default function AnswerViewArea() {
  const uploaded = useUploadedStore((state) => state.uploaded);

  const [answer, setAnswer] = useState("");
  const isStreaming = useIsStreamingStore((state) => state.isStreaming);
  const setIsStreaming = useIsStreamingStore((state) => state.setIsStreaming);

  const askQuestion = async (question: string) => {
    if (!question.trim()) return;

    setAnswer("");
    setIsStreaming(true);

    try {
      const formData = new FormData();
      formData.append("question", question);
      localStorage.removeItem("backendToken");
      let token: string | null = localStorage.getItem("backendToken");
      if (!token) {
        const response = await axios.get(`/api/backendJWT`);
        token = response.data as string;
        localStorage.setItem("backendToken", token);
      }
      const response = await fetch("http://localhost:8000/ask/", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      <motion.div
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className=" flex flex-col h-[93vh] "
      >
        <motion.div className="text-black h-[85vh] bg-slate-50 w-6xl  mx-auto rounded-lg ">
          <div className="h-full  overflow-y-auto scrollbar-thin text-xl p-8 border-2 rounded-lg pr-2 [&_.katex-display]:text-center [&_.katex-display]:my-6">
            {isStreaming && answer.length === 0 && (
              <div className="font-mono font-stretch-condensed animate-pulse">
                Thinking...
              </div>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {answer}
            </ReactMarkdown>
          </div>
        </motion.div>

        <div className=" justify-end mt-auto ">
          <div className="max-w-4xl mx-auto  ">
            <InputBox askQuestion={askQuestion} />
          </div>
        </div>
      </motion.div>
    )
  );
}
