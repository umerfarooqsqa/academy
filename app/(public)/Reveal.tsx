"use client";

// Scroll-reveal (2026-10-15, operator request): the wrapped element slides up
// and fades in the first time it scrolls into view; `delay` (ms) staggers
// cards in the same row so they come in one after another. Plain CSS
// (.reveal in app/globals.css) + a cheap scroll check — no animation
// library. With reduced motion or no JavaScript the content is simply shown.

import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Shown once its top has come up past 92% of the screen height — this
    // also catches cards the page jumped straight past (a fast fling, or a
    // link to further down), which an IntersectionObserver alone would miss
    // and leave invisible.
    let frame = 0;
    const check = () => {
      frame = 0;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        setShown(true);
        stop();
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    const stop = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    check();
    return stop;
  }, []);

  return (
    <div ref={ref} className={`reveal ${shown ? "is-shown" : ""} ${className}`} style={{ transitionDelay: shown ? `${delay}ms` : undefined }}>
      {children}
    </div>
  );
}
