// Plain-text formatting for admin-edited legal pages (/terms, 2026-10-15).
// The editor is a plain textarea, so the format is deliberately tiny:
//   - a blank line starts a new paragraph
//   - lines starting with "- " or "• " become a bullet list
// Everything is rendered as text (never HTML), so nothing typed in the
// admin panel can inject markup into the public page.

export type LegalBlock = { kind: "p"; text: string } | { kind: "ul"; items: string[] };

const BULLET = /^\s*(?:-|•)\s+/;

export function parseLegalText(body: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  for (const chunk of body.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    let para: string[] = [];
    let list: string[] = [];
    const flushPara = () => {
      if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
      para = [];
    };
    const flushList = () => {
      if (list.length) blocks.push({ kind: "ul", items: list });
      list = [];
    };
    for (const line of lines) {
      if (BULLET.test(line)) {
        flushPara();
        list.push(line.replace(BULLET, ""));
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara();
    flushList();
  }
  return blocks;
}
