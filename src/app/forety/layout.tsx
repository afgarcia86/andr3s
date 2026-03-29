import type { Metadata } from "next";

export const metadata: Metadata = {
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛳</text></svg>",
  },
  title: "I'm Turning 40 — Help Me Upgrade My Clubs",
  description:
    "Instead of guessing what to get me, help me finally get fitted for a real set of golf clubs.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "I'm Turning 40 — Help Me Upgrade My Clubs",
    description:
      "Instead of guessing what to get me, help me finally get fitted for a real set of golf clubs.",
    url: "https://andr3s.com/forety",
    siteName: "andr3s",
    type: "website",
    images: [
      {
        url: "https://andr3s.com/dre-needs-clubs.jpg",
        width: 900,
        height: 900,
        alt: "Dre sitting on a golf green looking defeated, surrounded by old clubs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "I'm Turning 40 — Help Me Upgrade My Clubs",
    description:
      "Instead of guessing what to get me, help me finally get fitted for a real set of golf clubs.",
    images: ["https://andr3s.com/dre-needs-clubs.jpg"],
  },
};

export default function ForetyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
