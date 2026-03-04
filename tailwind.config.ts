import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#89937C",
        surface: {
          light: "#f5f5f4",    // stone-100 — light mode page bg
          dark: "#221e22",      // near-black — dark mode page bg
        },
        text: {
          light: "#221e22",     // zinc-800 — light mode body text
          dark: "#e4e4e7",      // zinc-200 — dark mode body text
        },
      },
    },
  },
  plugins: [],
};

export default config;
