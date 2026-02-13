import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Survivor Social Oracle",
  description: "Risk intelligence for onchain social behavior — Tapestry × Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

