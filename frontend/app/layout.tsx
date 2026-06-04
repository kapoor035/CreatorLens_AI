import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorLens AI | Production-Quality Video RAG Comparison Suite",
  description: "Upload one YouTube URL and one Instagram Reel to get instant side-by-side engagement statistics, transcript comparisons, and multi-turn conversational AI coaching.",
  keywords: ["creator economy", "RAG chatbot", "youtube analytics", "instagram reels", "social media metrics"],
  authors: [{ name: "CreatorLens Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
