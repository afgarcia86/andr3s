"use client";

import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const handleLogoClick = () => {
    window.dispatchEvent(new CustomEvent("andr3s:reset-chat"));
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-black/[0.08] dark:border-white/[0.06] glass-strong">
      <button onClick={handleLogoClick} className="focus:outline-none">
        <Logo />
      </button>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          Resume ↓
        </a>
      </div>
    </header>
  );
}
