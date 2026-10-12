import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academy Admin — Tutor/Parent Matching",
  description: "Internal operator dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
