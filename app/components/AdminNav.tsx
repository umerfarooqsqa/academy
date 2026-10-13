"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/import", label: "Import chat" },
  { href: "/matches", label: "Matches" },
  { href: "/tutors", label: "Tutors" },
  { href: "/parents", label: "Parents" },
  { href: "/zones", label: "Zones" },
  { href: "/heatmap", label: "Heat map" },
  { href: "/website-content", label: "Website content" },
  { href: "/payments", label: "Payments", adminOnly: true },
  { href: "/finance", label: "Finance", adminOnly: true },
  { href: "/campaigns", label: "Campaigns", adminOnly: true },
  { href: "/marketing", label: "Marketing", adminOnly: true },
  { href: "/users", label: "Users", adminOnly: true },
  { href: "/logs", label: "Logs" },
];

export default function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleLinks = LINKS.filter((link) => !link.adminOnly || role === "admin");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">Academy Admin</span>
        <nav className="flex flex-wrap gap-1">
          {visibleLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-2.5 py-1.5 text-sm ${
                  active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="rounded border border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
