// Plain-text article format for the blog (/blog, 2026-10-15) — a tiny,
// safe subset of Markdown, written in a plain textarea on /articles:
//   ## Heading            ### Subheading
//   blank line = new paragraph
//   - bullet  /  • bullet        1. numbered item
//   **bold**                     [link text](/find-a-tutor) or (https://…)
// It is parsed into data and rendered as React text (RichText.tsx) — never
// HTML — so nothing typed in the admin panel can inject markup or scripts.
// Links must be site-relative ("/…", "#…") or http(s); anything else
// (javascript:, data:, //host) is shown as plain text.

export type Inline = { kind: "text"; text: string } | { kind: "bold"; text: string } | { kind: "link"; text: string; href: string };

export type RichBlock =
  | { kind: "h2" | "h3"; text: string }
  | { kind: "p"; inline: Inline[] }
  | { kind: "ul" | "ol"; items: Inline[][] };

export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^\/(?!\/)/.test(h) || h.startsWith("#")) return h;
  if (/^https?:\/\/[^\s]+$/i.test(h)) return h;
  return null;
}

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ kind: "text", text: text.slice(last, i) });
    if (m[1] !== undefined) out.push({ kind: "bold", text: m[1] });
    else {
      const href = safeHref(m[3]);
      out.push(href ? { kind: "link", text: m[2], href } : { kind: "text", text: m[2] });
    }
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

const BULLET = /^\s*(?:-|•)\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

export function parseRichText(body: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) blocks.push({ kind: "p", inline: parseInline(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: list.kind, items: list.items.map(parseInline) });
    list = null;
  };
  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      blocks.push({ kind: heading[1].length === 2 ? "h2" : "h3", text: heading[2].trim() });
      continue;
    }
    const kind = BULLET.test(line) ? "ul" : NUMBERED.test(line) ? "ol" : null;
    if (kind) {
      flushPara();
      if (list && list.kind !== kind) flushList();
      list ??= { kind, items: [] };
      list.items.push(line.replace(kind === "ul" ? BULLET : NUMBERED, ""));
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

/** Plain text of a body (for reading time, llms.txt, previews). */
export function plainText(body: string): string {
  const inlineText = (inline: Inline[]) => inline.map((i) => i.text).join("");
  return parseRichText(body)
    .map((b) => {
      if ("items" in b) return b.items.map(inlineText).join(" ");
      if ("inline" in b) return inlineText(b.inline);
      return b.text;
    })
    .join("\n");
}

export function readingMinutes(body: string): number {
  const words = plainText(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "How to find a tutor in Karachi?" → "how-to-find-a-tutor-in-karachi" */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** "15 October 2026" (Karachi time) — article dates. */
export function formatArticleDate(d: Date | null): string {
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" }) : "";
}
