import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "andr3s — What would you like to know?",
  description:
    "AI-powered resume. Chat with an agent that knows everything about Andres — experience, projects, skills, and more.",
  openGraph: {
    title: "andr3s — What would you like to know?",
    description:
      "Chat with an AI that knows everything about Andres' experience, projects, and skills.",
    url: "https://andr3s.com",
    siteName: "andr3s",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
