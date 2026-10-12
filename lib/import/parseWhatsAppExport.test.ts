import { describe, it, expect } from "vitest";
import { parseWhatsAppExport, formatTranscript, collectMediaFilenames } from "@/lib/import/parseWhatsAppExport";

describe("parseWhatsAppExport", () => {
  it("parses the Android export format (dash separator)", () => {
    const raw = [
      "12/10/26, 7:42 pm - Operator: Hi! Are you a tutor or a parent?",
      "12/10/26, 7:43 pm - Ali Tutor: I'm a tutor, I teach Chemistry and Biology",
    ].join("\n");
    const messages = parseWhatsAppExport(raw);
    expect(messages).toEqual([
      { sender: "Operator", text: "Hi! Are you a tutor or a parent?" },
      { sender: "Ali Tutor", text: "I'm a tutor, I teach Chemistry and Biology" },
    ]);
  });

  it("parses the iOS export format (bracketed timestamp)", () => {
    const raw = "[12/10/2026, 7:42:11 PM] Ali Tutor: Hello, I teach Chemistry";
    const messages = parseWhatsAppExport(raw);
    expect(messages).toEqual([{ sender: "Ali Tutor", text: "Hello, I teach Chemistry" }]);
  });

  it("merges unprefixed continuation lines into the previous message", () => {
    const raw = [
      "12/10/26, 7:43 pm - Ali Tutor: I teach:",
      "Chemistry",
      "Biology",
      "in North Nazimabad",
    ].join("\n");
    const messages = parseWhatsAppExport(raw);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("I teach:\nChemistry\nBiology\nin North Nazimabad");
  });

  it("flags a <Media omitted> line as a message with no filename", () => {
    const raw = "12/10/26, 7:50 pm - Ali Tutor: <Media omitted>";
    const messages = parseWhatsAppExport(raw);
    expect(messages).toEqual([{ sender: "Ali Tutor", text: "", mediaFilename: undefined }]);
  });

  it("flags a 'with media' attached-filename line", () => {
    const raw = "12/10/26, 7:50 pm - Ali Tutor: IMG-20261012-WA0001.jpg (file attached)";
    const messages = parseWhatsAppExport(raw);
    expect(messages).toEqual([{ sender: "Ali Tutor", text: "", mediaFilename: "IMG-20261012-WA0001.jpg" }]);
  });

  it("falls back to one unparsed block when no WhatsApp prefix is recognizable", () => {
    const raw = "just some random text\nwith no timestamps at all";
    const messages = parseWhatsAppExport(raw);
    expect(messages).toEqual([{ sender: "unknown", text: raw }]);
  });

  it("skips encryption/system lines with no sender (no colon)", () => {
    const raw = [
      "12/10/26, 7:40 pm - Messages and calls are end-to-end encrypted.",
      "12/10/26, 7:42 pm - Ali Tutor: Hello",
    ].join("\n");
    const messages = parseWhatsAppExport(raw);
    expect(messages).toEqual([{ sender: "Ali Tutor", text: "Hello" }]);
  });
});

describe("formatTranscript", () => {
  it("renders media messages as a bracketed marker", () => {
    const text = formatTranscript([
      { sender: "Operator", text: "send your CNIC" },
      { sender: "Ali Tutor", text: "", mediaFilename: "cnic.jpg" },
    ]);
    expect(text).toBe("Operator: send your CNIC\nAli Tutor: [sent an image: cnic.jpg]");
  });
});

describe("collectMediaFilenames", () => {
  it("returns filenames in chronological order", () => {
    const filenames = collectMediaFilenames([
      { sender: "Ali Tutor", text: "", mediaFilename: "cnic.jpg" },
      { sender: "Ali Tutor", text: "here's my marksheet" },
      { sender: "Ali Tutor", text: "", mediaFilename: "marksheet.jpg" },
    ]);
    expect(filenames).toEqual(["cnic.jpg", "marksheet.jpg"]);
  });
});
