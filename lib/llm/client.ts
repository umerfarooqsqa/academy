// LLM client (CLAUDE.md 6.2): Groq `llama-3.3-70b-versatile` primary, Gemini free
// tier as fallback when Groq errors or rate-limits. JSON mode on both.
//
// This module ONLY does the two language jobs allowed by Section 3.1: extraction
// (message -> one JSON profile) and reply generation (structured data -> text).
// It must never receive a candidate list or more than one profile of data.

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// [§6.2] originally fixed to "llama-3.3-70b-versatile" — Groq discontinued that
// model entirely (confirmed live, 2026-10-12: GET /openai/v1/models no longer
// lists any Llama chat model on this account, returns 404 model_not_found).
// openai/gpt-oss-20b is the closest current equivalent: fast, free-tier, JSON
// mode + structured-output support. See CLAUDE.md Section 4 deviation note.
export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
// [GAP] §6.2 names only "Gemini free tier" — model id not specified. Flash is the
// standard free-tier choice; confirm with operator. Overridable via env.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export class LlmError extends Error {}

type ChatArgs = {
  system: string;
  user: string;
  /** JSON mode. Always true for this project's two use cases. */
  json?: boolean;
  temperature?: number;
};

async function callGroq({ system, user, json = true, temperature = 0 }: ChatArgs): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new LlmError("GROQ_API_KEY not set");
  const groq = new Groq({ apiKey });
  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature,
    response_format: json ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const content = res.choices[0]?.message?.content;
  if (!content) throw new LlmError("Groq returned empty content");
  return content;
}

async function callGemini({ system, user, json = true, temperature = 0 }: ChatArgs): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new LlmError("GEMINI_API_KEY not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: system,
    generationConfig: {
      temperature,
      responseMimeType: json ? "application/json" : "text/plain",
    },
  });
  const res = await model.generateContent(user);
  const text = res.response.text();
  if (!text) throw new LlmError("Gemini returned empty content");
  return text;
}

/**
 * Run a chat completion with Groq, falling back to Gemini on any Groq failure
 * (network error, 5xx, or 429 rate-limit). Returns the raw string content —
 * callers parse + zod-validate it themselves.
 */
export async function chat(args: ChatArgs): Promise<{ content: string; provider: "groq" | "gemini" }> {
  try {
    const content = await callGroq(args);
    return { content, provider: "groq" };
  } catch (groqErr) {
    console.warn("[llm] Groq failed, falling back to Gemini:", (groqErr as Error).message);
    try {
      const content = await callGemini(args);
      return { content, provider: "gemini" };
    } catch (geminiErr) {
      throw new LlmError(
        `Both LLM providers failed. Groq: ${(groqErr as Error).message}. ` +
          `Gemini: ${(geminiErr as Error).message}.`,
      );
    }
  }
}

/** Parse a JSON string that may still be wrapped in ```json fences despite the prompt. */
export function parseJsonLoose(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed);
}
