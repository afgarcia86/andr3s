"use client";

import { useState } from "react";

const GOAL = 2500;
const RAISED = 800;
const PERCENT = Math.round((RAISED / GOAL) * 100);

const ZELLE_PHONE = "7033891081";

const links = [
  {
    label: "Contribute via Venmo",
    detail: "@Andres-Garcia-2",
    href: "https://venmo.com/u/Andres-Garcia-2",
    bg: "bg-sky-500 hover:bg-sky-600",
  },
  {
    label: "Chip in with PayPal",
    detail: "paypal.me/afgarcia86",
    href: "https://paypal.me/afgarcia86",
    bg: "bg-blue-600 hover:bg-blue-700",
  },
];

export default function Forety() {
  const [copied, setCopied] = useState(false);

  const copyZelle = () => {
    navigator.clipboard.writeText(ZELLE_PHONE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-800">
      <div className="mx-auto max-w-md px-5 py-6 flex flex-col items-center gap-4">
        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
          Help Me Upgrade My Clubs ⛳️
        </h1>

        {/* Hero — horizontal crop */}
        <div className="w-full rounded-xl overflow-hidden shadow-lg">
          <img
            src="/dre-needs-clubs.jpg"
            alt="Dre sitting on a golf green surrounded by beat-up clubs, looking defeated"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Tagline */}
        <p className="text-zinc-500 text-base text-center">
          Instead of guessing what to get me for my 40th, chip in toward the one thing I actually want:<br/> <strong>A custom fitted set of golf clubs!</strong>
        </p>

        {/* Progress */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>${RAISED.toLocaleString()} raised</span>
            <span>${GOAL.toLocaleString()} goal</span>
          </div>
          <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${PERCENT}%` }}
            />
          </div>
          <p className="text-center text-xs text-zinc-400">
            {PERCENT}% to new clubs &middot; {100 - PERCENT}% suffering remains
          </p>
        </div>

        {/* Payment buttons */}
        <div className="w-full space-y-2">
          {/* Zelle — tap to copy */}
          <div className="text-center space-y-1">
            <button
              onClick={copyZelle}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-base active:scale-[0.98] transition-transform"
            >
              {copied ? "Copied!" : "Send with Zelle"}
            </button>
            <p className="text-xs text-zinc-400">
              Tap to copy: {ZELLE_PHONE}
            </p>
          </div>

          {/* Venmo & PayPal */}
          {links.map((p) => (
            <div key={p.label} className="text-center space-y-1">
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-white font-semibold py-3 rounded-xl text-base ${p.bg} active:scale-[0.98] transition-transform`}
              >
                {p.label}
              </a>
              <p className="text-xs text-zinc-400">{p.detail}</p>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-xs text-zinc-500 leading-relaxed px-2">
          No pressure at all. If you were planning to get me something for my 40th,
          this is genuinely what I&rsquo;d love most. It saves everyone from
          guessing, and saves me from another season with these absolute awful
          clubs.
        </p>

        {/* Divider */}
        <hr className="w-16 border-zinc-200" />

        {/* Why */}
        <div className="w-full space-y-1">
          <h2 className="font-bold text-sm">Why golf clubs?</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            I&rsquo;ve been playing with the same old, unforgiving clubs for
            way too long and they&rsquo;re not doing my game any favors. Time to
            finally get fitted for a set that works with me instead of against me.
          </p>
        </div>

        {/* FAQ */}
        <div className="w-full space-y-1">
          <h2 className="font-bold text-sm">
            What if the goal is exceeded?
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Grip upgrades, a bag, or a lesson so the clubs don&rsquo;t go to
            waste.
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-zinc-300 pt-4">Andres turns 40!</p>
      </div>
    </div>
  );
}
