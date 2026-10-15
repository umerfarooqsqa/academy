"use client";

// Blog article list + editor for /articles (SEO + GEO, 2026-10-15).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { card, input, label, btnPrimary, btnSecondary, btnDanger, badge } from "@/app/components/ui";
import { slugify } from "@/lib/richText";

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
}

type Draft = { id?: string; title: string; slug: string; description: string; body: string; status: string };

const EMPTY: Draft = { title: "", slug: "", description: "", body: "", status: "draft" };

const FORMAT_HELP = `## Heading   ### Subheading
Blank line = new paragraph
- bullet point     1. numbered point
**bold**     [link text](/tutors-in-karachi)`;

export default function ArticlesClient({ articles }: { articles: ArticleRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function edit(a: ArticleRow) {
    setDraft({ id: a.id, title: a.title, slug: a.slug, description: a.description, body: a.body, status: a.status });
    setSlugTouched(true);
    setError(null);
  }

  async function request(url: string, method: string, body?: object): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return false;
    }
    router.refresh();
    return true;
  }

  async function save(status?: "draft" | "published") {
    if (!draft) return;
    const payload = { title: draft.title, slug: draft.slug, description: draft.description, body: draft.body, status: status ?? draft.status };
    const ok = draft.id ? await request(`/api/articles/${draft.id}`, "PATCH", payload) : await request("/api/articles", "POST", payload);
    if (ok) setDraft(null);
  }

  if (draft) {
    const descLen = draft.description.length;
    return (
      <div className={`${card} mt-4 flex flex-col gap-4`}>
        <div>
          <label className={label}>Title (also the page heading — put the main keyword in it)</label>
          <input
            className={input}
            maxLength={120}
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value;
              setDraft({ ...draft, title, slug: slugTouched ? draft.slug : slugify(title) });
            }}
          />
        </div>
        <div>
          <label className={label}>Address: /blog/{draft.slug || "…"}</label>
          <input
            className={input}
            value={draft.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setDraft({ ...draft, slug: e.target.value });
            }}
          />
        </div>
        <div>
          <label className={label}>
            Description — shown in Google results ({descLen}/160{descLen > 160 ? " — Google may cut it off" : ""})
          </label>
          <textarea className={`${input} h-16`} maxLength={200} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div>
          <label className={label}>Article</label>
          <pre className="mb-1.5 whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-500">{FORMAT_HELP}</pre>
          <textarea className={`${input} h-96 font-mono`} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button className={btnPrimary} disabled={busy} onClick={() => save("published")}>
            {draft.status === "published" ? "Save (published)" : "Publish"}
          </button>
          <button className={btnSecondary} disabled={busy} onClick={() => save("draft")}>
            {draft.status === "published" ? "Unpublish (save as draft)" : "Save draft"}
          </button>
          <button className={btnSecondary} disabled={busy} onClick={() => setDraft(null)}>
            Cancel
          </button>
          {draft.id && draft.status === "published" && (
            <a href={`/blog/${draft.slug}`} target="_blank" rel="noopener noreferrer" className="self-center text-sm text-blue-600 hover:underline">
              View live ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div>
        <button
          className={btnPrimary}
          onClick={() => {
            setDraft({ ...EMPTY });
            setSlugTouched(false);
          }}
        >
          New article
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {articles.length === 0 && <p className="text-sm text-gray-500">No articles yet.</p>}
      {articles.map((a) => (
        <div key={a.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{a.title}</p>
            <p className="text-xs text-gray-500">
              /blog/{a.slug} · updated {a.updatedAt.slice(0, 10)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={badge(a.status === "published" ? "green" : "gray")}>{a.status}</span>
            {a.status === "published" && (
              <a href={`/blog/${a.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                view ↗
              </a>
            )}
            <button className={btnSecondary} onClick={() => edit(a)}>
              Edit
            </button>
            <button
              className={btnDanger}
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Delete “${a.title}”? This can't be undone.`)) request(`/api/articles/${a.id}`, "DELETE");
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
