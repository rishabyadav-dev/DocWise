import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeBlock({
  className,
  children,
  inline,
  ...props
}: any) {
  const match = /language-(\w+)/.exec(className || "");
  const [copied, setCopied] = useState(false);

  const codeString = String(children).trim();
  const isSingleWord = !/\s/.test(codeString);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (inline || isSingleWord) {
    return (
      <code className="rounded bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-sm font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="group block my-3 max-w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code to clipboard"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <SyntaxHighlighter
        language={match ? match[1] : "text"}
        style={atomDark}
        PreTag="div"
        customStyle={{
          background: "transparent",
          margin: 0,
          padding: "0.75rem",
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
          lineHeight: "1.4",
        }}
        {...props}
      >
        {codeString.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}
