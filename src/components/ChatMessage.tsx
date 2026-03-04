"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export function ChatMessage({ role, content, sources }: ChatMessageProps) {
  const isUser = role === "user";

  // Strip [Sources: ...] from displayed content (shown separately)
  const displayContent = content.replace(/\n?\[Sources?:\s*[^\]]*\]/gi, "");

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%] flex-row-reverse">
          <div className="shrink-0 w-6 h-6 rounded-full bg-accent/15 dark:bg-accent/20 flex items-center justify-center mt-0.5">
            <span className="text-accent text-xs font-bold">Y</span>
          </div>
          <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl px-4 py-3">
            <p className="whitespace-pre-wrap">{displayContent}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center mt-0.5">
        <span className="text-white text-xs font-bold">A</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="chat-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayContent}
          </ReactMarkdown>
        </div>

        {sources && sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-black/10 dark:border-white/10">
            <p className="text-xs opacity-40">
              Sources: {sources.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
