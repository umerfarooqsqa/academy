// Chat bubbles for the Lili chat (LiliChat.tsx, LocationStep.tsx), in the
// public site's "sticker" style (solid offset shadow, 2px dark border).

import Lili from "./Lili";

export const chipClass =
  "rounded-full border-2 border-gray-900 bg-white px-3.5 py-2 text-sm font-bold text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition hover:-translate-y-0.5 hover:bg-amber-100 active:translate-y-0 active:shadow-none disabled:opacity-50";
export const chipActiveClass =
  "rounded-full border-2 border-gray-900 bg-teal-400 px-3.5 py-2 text-sm font-bold text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition active:translate-y-0 active:shadow-none";
export const sendClass =
  "rounded-full border-2 border-gray-900 bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_0_#1f2937] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50";
export const skipClass = "rounded-full px-3 py-2 text-sm font-bold text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline";

/** Lili's message. `avatar` shows the animated fox (only on the latest
 * message, so the thread isn't a wall of moving foxes); otherwise a spacer
 * keeps every bubble aligned. */
export function LiliBubble({ children, avatar = false, tone = "normal" }: { children: React.ReactNode; avatar?: boolean; tone?: "normal" | "warn" }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 shrink-0">{avatar && <Lili className="w-8" />}</div>
      <div
        className={`max-w-[85%] rounded-2xl rounded-bl-sm border-2 border-gray-900 px-4 py-2.5 text-[15px] leading-snug text-gray-900 shadow-[3px_3px_0_0_#1f2937] ${
          tone === "warn" ? "bg-amber-100" : "bg-white"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <LiliBubble avatar>
      <span className="inline-flex gap-1 py-1" aria-label="Lili is typing">
        {[0, 150, 300].map((d) => (
          <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    </LiliBubble>
  );
}

/** The person's answer. Tapping it (when `onEdit` is given) rewinds the chat
 * to that question. */
export function UserBubble({ children, onEdit }: { children: React.ReactNode; onEdit?: () => void }) {
  const body = (
    <span className="block max-w-full whitespace-pre-wrap break-words rounded-2xl rounded-br-sm border-2 border-gray-900 bg-rose-500 px-4 py-2.5 text-left text-[15px] font-semibold leading-snug text-white shadow-[3px_3px_0_0_#1f2937]">
      {children}
    </span>
  );
  return (
    <div className="flex justify-end pl-10">
      {onEdit ? (
        <button type="button" onClick={onEdit} title="Tap to change" className="group flex max-w-[85%] items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400 opacity-0 transition group-hover:opacity-100">✎ change</span>
          {body}
        </button>
      ) : (
        <div className="max-w-[85%]">{body}</div>
      )}
    </div>
  );
}
