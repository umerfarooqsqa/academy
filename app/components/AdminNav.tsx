"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Shown next to whichever link is currently navigating (Next 15's
// useLinkStatus — must render inside the Link's children). Clicking a nav
// link previously gave no feedback until the whole target page's data
// finished loading (no loading.tsx existed), which read as "the navbar is
// slow" — this plus app/(admin)/loading.tsx fixes that. Static text, not an
// animation, per Section 7's "no animations" rule for the admin dashboard.
function PendingHint() {
  const { pending } = useLinkStatus();
  return pending ? <span className="ml-1 opacity-70">…</span> : null;
}

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/import", label: "Import chat" },
  { href: "/matches", label: "Matches" },
  { href: "/tutors", label: "Tutors" },
  { href: "/parents", label: "Parents" },
  { href: "/zones", label: "Zones" },
  { href: "/heatmap", label: "Heat map" },
  { href: "/website-content", label: "Website content" },
  { href: "/articles", label: "Blog" },
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
                <PendingHint />
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
