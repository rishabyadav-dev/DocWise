import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeBlock({ className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || "");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  return match ? (
    <div className="relative my-4 rounded-lg border bg-black/90 dark:bg-[#23272f]">
      <button
        onClick={handleCopy}
        className="absolute cursor-pointer top-2 right-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-blue-200 dark:hover:bg-blue-600 transition"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <SyntaxHighlighter
        language={match[1]}
        style={atomDark}
        PreTag="div"
        customStyle={{
          background: "transparent",
          margin: 0,
          padding: "1em",
          borderRadius: "0.5em",
        }}
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className="rounded bg-gray-200 dark:bg-gray-700 px-1 py-0.5">
      {children}
    </code>
  );
}
