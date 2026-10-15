// Keeps the staff login page out of search results (SEO, 2026-10-15).
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Staff login", robots: { index: false, follow: false } };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
