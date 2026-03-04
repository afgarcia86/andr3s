"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { useChat } from "@/hooks/useChat";

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center mt-0.5">
        <span className="text-white text-xs font-bold">A</span>
      </div>
      <div className="flex gap-1.5 pt-2">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current/40" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current/40" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-current/40" />
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleReset = () => clearMessages();
    window.addEventListener("andr3s:reset-chat", handleReset);
    return () => window.removeEventListener("andr3s:reset-chat", handleReset);
  }, [clearMessages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto overflow-hidden">
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-6 tracking-tight text-center">
            What would you like to know?
          </h1>

          <div className="w-full mb-6">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </div>

          <SuggestedPrompts onSelect={sendMessage} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.map((msg, i) => (
              <ChatMessage key={i} {...msg} />
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role === "user" && (
                <TypingIndicator />
              )}
            {!isLoading && messages.length > 0 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={clearMessages}
                  className="text-xs opacity-40 hover:opacity-70 px-2.5 py-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all flex items-center gap-1"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                  </svg>
                  Start over
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 pb-4 pt-2">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
            <p className="text-center text-xs opacity-35 mt-2">
              andr3s might be wrong — feel free to ask him instead.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
