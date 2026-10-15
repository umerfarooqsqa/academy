// Renders the article format from lib/richText.ts as React elements — text
// only, never HTML. Server component.

import Link from "next/link";
import { parseRichText, type Inline } from "@/lib/richText";

function InlineText({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "bold") return <strong key={i}>{p.text}</strong>;
        if (p.kind === "link") {
          return p.href.startsWith("/") || p.href.startsWith("#") ? (
            <Link key={i} href={p.href} className="font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700">
              {p.text}
            </Link>
          ) : (
            <a key={i} href={p.href} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-rose-600 underline underline-offset-2">
              {p.text}
            </a>
          );
        }
        return <span key={i}>{p.text}</span>;
      })}
    </>
  );
}

export default function RichText({ body }: { body: string }) {
  return (
    <div className="space-y-5 text-[17px] leading-relaxed text-slate-700">
      {parseRichText(body).map((b, i) => {
        if ("items" in b) {
          const ListTag = b.kind === "ol" ? "ol" : "ul";
          return (
            <ListTag key={i} className={`space-y-2 pl-6 ${b.kind === "ol" ? "list-decimal" : "list-disc"}`}>
              {b.items.map((it, j) => (
                <li key={j}>
                  <InlineText parts={it} />
                </li>
              ))}
            </ListTag>
          );
        }
        if ("inline" in b) {
          return (
            <p key={i}>
              <InlineText parts={b.inline} />
            </p>
          );
        }
        return b.kind === "h2" ? (
          <h2 key={i} className="pt-4 font-heading text-2xl font-bold text-slate-900">
            {b.text}
          </h2>
        ) : (
          <h3 key={i} className="pt-2 font-heading text-xl font-semibold text-slate-900">
            {b.text}
          </h3>
        );
      })}
    </div>
  );
}
