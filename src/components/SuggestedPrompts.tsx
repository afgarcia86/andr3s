"use client";

const PROMPTS = [
  "Give me the TLDR overview.",
  "What systems have you built?",
  "What are your strongest skills?",
  "What roles are you a good fit for?",
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="hidden sm:grid sm:grid-cols-2 gap-2.5 w-full max-w-lg">
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="text-center text-[13px] px-4 py-2.5 rounded-full border border-black/10 dark:border-white/[0.08] glass hover:border-accent/40 hover:bg-white/80 dark:hover:bg-white/10 transition-colors opacity-55 hover:opacity-80"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
