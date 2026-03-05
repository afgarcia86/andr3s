"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { VoiceCallModal } from "./VoiceCallModal";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Show voice call tooltip on page load
  useEffect(() => {
    const showTimer = setTimeout(() => setShowTooltip(true), 250);
    const hideTimer = setTimeout(() => setShowTooltip(false), 7000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Auto-focus on mount and after chat completion (disabled → enabled)
  const prevDisabled = useRef(disabled);
  useEffect(() => {
    if (prevDisabled.current && !disabled) {
      textareaRef.current?.focus();
    }
    prevDisabled.current = disabled;
  }, [disabled]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const hasText = value.trim().length > 0;

  return (
    <>
      <div className="flex items-center gap-2 rounded-full px-3 py-2 border bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border-black/10 dark:border-white/[0.06] focus-within:border-accent/50 transition-colors">
        {/* Phone / voice call button (left side) */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setShowVoiceCall(true);
              setShowTooltip(false);
            }}
            disabled={disabled}
            className="p-2 rounded-full transition-all opacity-60 hover:opacity-100 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Start voice call"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
              />
            </svg>
          </button>

          {/* Voice call tooltip */}
          <div
            className={`voice-tooltip ${showTooltip ? "voice-tooltip-visible" : ""}`}
          >
            <span>Talk to andr3s</span>
            <div className="voice-tooltip-arrow" />
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about my experience…"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm sm:text-base leading-normal placeholder:text-current/35 disabled:opacity-50 max-h-40 px-1"
        />

        {/* Submit button (right side) */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !hasText}
          className={`shrink-0 p-2 rounded-full transition-all ${
            hasText
              ? "bg-accent text-white opacity-100 hover:opacity-90"
              : "opacity-30 cursor-default"
          } disabled:cursor-not-allowed`}
          aria-label="Send message"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
            />
          </svg>
        </button>
      </div>

      {showVoiceCall && (
        <VoiceCallModal onClose={() => setShowVoiceCall(false)} />
      )}
    </>
  );
}
