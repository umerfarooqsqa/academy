// Parses WhatsApp's native "Export Chat" .txt format into a flat list of
// messages (CLAUDE.md chat-import pivot, 2026-10). Pure function, no I/O.
//
// Deliberately does NOT parse real Date objects or attempt to determine which
// side is "us" vs. the other party — file order is already chronological
// (nothing downstream needs per-message timestamps), and distinguishing the
// two sides is a language-understanding task left to the extraction LLM
// (Section 3: "LLM does language only, code does logic").
//
// WhatsApp's line format varies by platform/locale, e.g.:
//   Android: "12/10/26, 7:42 pm - Ali Tutor: Hello, I teach Chemistry"
//   iOS:     "[12/10/2026, 7:42:11 PM] Ali Tutor: Hello, I teach Chemistry"
// A message can span multiple lines with no prefix on continuation lines.
// Media appears either as a placeholder ("<Media omitted>" — export without
// media) or a bare attached-filename line (export with media, e.g.
// "IMG-20261012-WA0001.jpg (file attached)").

export interface ParsedMessage {
  sender: string;
  text: string;
  mediaFilename?: string;
}

// Android: "DD/MM/YY(YY), H:MM am/pm - Sender: text" (dash separator, optional seconds).
const ANDROID_PREFIX = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?\s*-\s*(.*)$/i;
// iOS: "[DD/MM/YYYY, H:MM:SS am/pm] Sender: text" (bracketed timestamp).
const IOS_PREFIX = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?\]\s*(.*)$/i;

const MEDIA_OMITTED = /^<Media omitted>$/i;
// "With media" exports: a bare line naming the attached file, e.g.
// "IMG-20261012-WA0001.jpg (file attached)" or just the filename on its own line.
const MEDIA_ATTACHED = /^(.+\.(?:jpg|jpeg|png|webp|gif))\s*(?:\(file attached\))?$/i;

function splitSenderAndText(rest: string): { sender: string; text: string } | null {
  const colonIndex = rest.indexOf(": ");
  if (colonIndex === -1) return null; // system message (e.g. "Messages are end-to-end encrypted") — no sender
  return { sender: rest.slice(0, colonIndex).trim(), text: rest.slice(colonIndex + 2) };
}

/**
 * Parses a WhatsApp chat export transcript into an ordered list of messages.
 * Falls back to treating the whole input as one unparsed block (sender
 * "unknown") if no line matches a recognizable WhatsApp prefix — the
 * extraction LLM can still work with raw, unstructured text.
 */
export function parseWhatsAppExport(raw: string): ParsedMessage[] {
  const lines = raw.replace(/\r\n/g, "\n").replace(/‎/g, "").split("\n");
  const messages: ParsedMessage[] = [];
  let sawAnyPrefix = false;

  for (const line of lines) {
    const androidMatch = line.match(ANDROID_PREFIX);
    const iosMatch = line.match(IOS_PREFIX);
    const prefixMatch = androidMatch ?? iosMatch;

    if (prefixMatch) {
      sawAnyPrefix = true;
      const parsed = splitSenderAndText(prefixMatch[2]);
      if (!parsed) continue; // system message, no sender — skip

      const mediaMatch = parsed.text.match(MEDIA_ATTACHED);
      if (MEDIA_OMITTED.test(parsed.text.trim())) {
        messages.push({ sender: parsed.sender, text: "", mediaFilename: undefined });
      } else if (mediaMatch) {
        messages.push({ sender: parsed.sender, text: "", mediaFilename: mediaMatch[1] });
      } else {
        messages.push({ sender: parsed.sender, text: parsed.text });
      }
      continue;
    }

    // Continuation line (no timestamp prefix) — merge into the previous message.
    if (line.trim() === "") continue;
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      last.text = last.text ? `${last.text}\n${line}` : line;
    } else {
      messages.push({ sender: "unknown", text: line });
    }
  }

  if (!sawAnyPrefix && messages.length > 0) {
    // No recognizable WhatsApp prefix anywhere — collapse into one block so
    // the extraction prompt still receives the raw text rather than a
    // misleading per-line split.
    return [{ sender: "unknown", text: raw.trim() }];
  }

  return messages;
}

/** Renders parsed messages back into a plain "Sender: text" transcript for the
 * extraction prompt — media lines are rendered as a bracketed marker so the
 * LLM knows an image was sent without needing the actual bytes. */
export function formatTranscript(messages: ParsedMessage[]): string {
  return messages
    .map((m) => {
      if (m.mediaFilename) return `${m.sender}: [sent an image: ${m.mediaFilename}]`;
      return `${m.sender}: ${m.text}`;
    })
    .join("\n");
}

/** All media filenames referenced anywhere in the transcript, in chronological
 * order — used to pair uploaded zip entries with document classification
 * (first = CNIC, rest = marksheet; see lib/intake/documents.ts). */
export function collectMediaFilenames(messages: ParsedMessage[]): string[] {
  return messages.filter((m) => m.mediaFilename).map((m) => m.mediaFilename!);
}
