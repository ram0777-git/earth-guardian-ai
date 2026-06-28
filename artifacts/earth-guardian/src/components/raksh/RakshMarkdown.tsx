import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

function CodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false);
  const code = typeof children === "string" ? children : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isBlock = className?.includes("language-");

  if (!isBlock) {
    return (
      <code
        className="rounded bg-slate-800/70 px-1.5 py-0.5 text-xs text-cyan-300 font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-md bg-slate-700 p-1.5 text-slate-300 hover:text-white hover:bg-slate-600"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <code className={className} {...props}>
        {children}
      </code>
    </div>
  );
}

export function RakshMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code: CodeBlock as React.ComponentType<React.HTMLAttributes<HTMLElement>>,
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-white mb-2 mt-3">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-white mb-2 mt-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-slate-100 mb-1.5 mt-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-slate-200 leading-relaxed mb-2 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="text-sm text-slate-200 space-y-1 mb-2 ml-4 list-disc">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="text-sm text-slate-200 space-y-1 mb-2 ml-4 list-decimal">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-cyan-300">{children}</em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-cyan-400/60 pl-3 my-2 text-slate-300 italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-lg border border-white/10">
            <table className="w-full text-xs text-slate-200">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/10 text-slate-100">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border-t border-white/5">{children}</td>
        ),
        hr: () => <hr className="border-white/10 my-3" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
