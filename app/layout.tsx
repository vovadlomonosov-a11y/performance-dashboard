import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Accountability Dashboard — Upstate Auto Styling",
  description: "Daily team performance tracking dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
