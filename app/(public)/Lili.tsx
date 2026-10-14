// Lili, the fox mascot, animated with plain CSS (no animation library).
// The original art is a single flat PSD, so public/lili/ holds three
// hand-cut layers of it on one shared canvas — tail (with the area hidden
// behind the body filled in, so wagging never opens a gap), body, and head —
// stacked and moved independently. Blinking is two fur-colored eyelids
// scaled over the eyes. Decorative only: the logo link already carries the
// site name as text.

import styles from "./Lili.module.css";

export default function Lili({ className = "", talking = false }: { className?: string; talking?: boolean }) {
  return (
    <div className={`${styles.hop} ${talking ? styles.talking : ""} ${className}`} aria-hidden="true">
      <div className={styles.lili}>
        <img src="/lili/tail.webp" alt="" className={`${styles.part} ${styles.tail}`} />
        <img src="/lili/body.webp" alt="" className={styles.part} />
        <div className={styles.head}>
          <img src="/lili/head.webp" alt="" className={styles.part} />
          <span className={`${styles.lid} ${styles.lidLeft}`} />
          <span className={`${styles.lid} ${styles.lidRight}`} />
        </div>
      </div>
    </div>
  );
}
