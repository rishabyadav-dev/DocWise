"use client";
import {
  useIsStreamingStore,
  useSuggestionsStore,
  useUploadedStore,
} from "@/store/uploadStore";
import axios from "axios";
import "katex/dist/katex.min.css";
import { motion } from "motion/react";
import { Merriweather } from "next/font/google";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Button } from "../ui/button";
import CodeBlock from "./CodeBlock";
import InputBox from "./inputBox";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export default function AnswerViewArea() {
  const uploaded = useUploadedStore((state) => state.uploaded);
  const [answer, setAnswer] = useState("");
  const isStreaming = useIsStreamingStore((state) => state.isStreaming);
  const setIsStreaming = useIsStreamingStore((state) => state.setIsStreaming);
  const data = useSuggestionsStore((state) => state.suggestions);

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/ask/`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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

  const processedAnswer = answer
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with just 2
    .trim(); // Remove leading/trailing whitespace

  const displayContent = processedAnswer;

  return (
    uploaded && (
      <motion.div
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex border-t-2 flex-col  lg:p-0  lg:w-full w-screen h-[94vh] lg:h-[94vh]"
      >
        <div
          className={`!font-sans ${merriweather.className} overflow-x-hidden overflow-y-auto pt-3 lg:py-4 lg:px-52 px-3 scroll-auto scrollbar-thin
    prose dark:prose-invert prose-slate max-w-none
    leading-relaxed 

    /* Base text styling */
    [&>*]:text-sm
    [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-4
    [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3
    [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-1 [&_h3]:mt-2
    [&_h4]:text-sm [&_h4]:font-medium [&_h4]:mb-1 [&_h4]:mt-2

    /* Paragraph styling */
    [&_p]:text-sm [&_p]:mb-2 [&_p]:leading-relaxed
    [&_p]:text-gray-700 [&_p]:dark:text-gray-300

    /* List styling */
    [&_ul]:mb-2 [&_ul]:space-y-0.5
    [&_ol]:mb-2 [&_ol]:space-y-0.5
    [&_li]:text-sm [&_li]:leading-relaxed
    [&_li]:text-gray-700 [&_li]:dark:text-gray-300

    /* Link styling */
    [&_a]:underline [&_a]:text-blue-600 [&_a]:dark:text-blue-400
    [&_a]:hover:text-blue-800 [&_a]:dark:hover:text-blue-300

    /* Math styling */
    [&_.katex-display]:text-center [&_.katex-display]:my-2

    /* Strong/bold styling */
    [&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-gray-100

    /* Blockquote styling */
    [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:dark:border-gray-600
    [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2

    /* Table styling */
    [&_table]:w-full [&_table]:my-2 [&_table]:border-collapse
    [&_th]:border [&_th]:border-gray-300 [&_th]:dark:border-gray-600 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-gray-50 [&_th]:dark:bg-gray-800
    [&_td]:border [&_td]:border-gray-300 [&_td]:dark:border-gray-600 [&_td]:px-2 [&_td]:py-1

    /* Large screen adjustments */
    lg:leading-relaxed
    lg:[&>*]:text-base
    lg:[&_h1]:text-xl lg:[&_h1]:mb-3 lg:[&_h1]:mt-5
    lg:[&_h2]:text-lg lg:[&_h2]:mb-2 lg:[&_h2]:mt-4
    lg:[&_h3]:text-base lg:[&_h3]:mb-2 lg:[&_h3]:mt-3
    lg:[&_h4]:text-sm lg:[&_h4]:mb-1 lg:[&_h4]:mt-2
    lg:[&_p]:text-base lg:[&_p]:mb-3
    lg:[&_ul]:mb-3 lg:[&_ul]:space-y-1
    lg:[&_ol]:mb-3 lg:[&_ol]:space-y-1
    lg:[&_li]:text-base
    lg:[&_.katex-display]:my-3
    lg:[&_blockquote]:my-3
    lg:[&_table]:my-3
  `}
        >
          {processedAnswer.length === 0 && !isStreaming && (
            <div className="w-full font-serif font-medium mt-5 lg:mt-3 flex flex-col gap-2 ">
              <div className=" text-lg mb-4 text-center lg:mb-8 lg:text-2xl">
                {data?.summary}
              </div>
              <div className="flex justify-center w-full flex-wrap gap-2 lg:gap-3">
                {data?.suggested_questions?.map((s, index) => (
                  <div key={index}>
                    <Button
                      onClick={() => askQuestion(s)}
                      className="min-w-0 cursor-pointer h-fit   lg:text-[22px] place-content-center text-center block break-words whitespace-normal  rounded-full px-2.5 py-1.5 text-[16px]  max-w-[90vw] w-fit lg:px-4 lg:py-1.5 duration-500 hover:shadow-md shadow-2xs  shadow-foreground/20 hover:shadow-foreground/30 hover:bg-input bg-accent border text-foreground border-foreground/10"
                    >
                      {s}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isStreaming && processedAnswer.length === 0 && (
            <div className="font-mono font-stretch-condensed animate-pulse">
              Thinking...
            </div>
          )}
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code: ({ node, inline, className, children, ...props }: any) => {
                return (
                  <CodeBlock className={className} inline={inline} {...props}>
                    {children}
                  </CodeBlock>
                );
              },
              pre: ({ node, children, ...props }: any) => {
                return <>{children}</>;
              },
              p: ({ node, children, ...props }: any) => {
                const blockTags = [
                  "code",
                  "pre",
                  "table",
                  "div",
                  "ul",
                  "ol",
                  "li",
                  "blockquote",
                  "h1",
                  "h2",
                  "h3",
                  "h4",
                  "h5",
                  "h6",
                ];

                const hasBlock = node?.children?.some(
                  (child: any) =>
                    child.type === "element" &&
                    blockTags.includes(child.tagName),
                );

                if (hasBlock) {
                  return <>{children}</>;
                }

                return <p {...props}>{children}</p>;
              },
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        <div className=" bg-input mt-auto">
          <div className="lg:max-w-4xl  w-full mx-auto">
            <InputBox setAnswer={setAnswer} askQuestion={askQuestion} />
          </div>
        </div>
      </motion.div>
    )
  );
}
