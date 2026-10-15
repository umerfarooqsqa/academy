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
    // suppressHydrationWarning: the public layout adds a "js" class to <html>
    // before hydration, for the scroll-reveal CSS (app/globals.css).
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
