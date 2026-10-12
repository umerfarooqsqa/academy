// Neglected-parent detection — pure logic, zero Prisma access (mirrors the
// lib/matching/engine.ts / lib/finance/* pure-function convention). "Unattended"
// covers two failure modes, both confirmed with the operator: a ParentRequest
// still pending (never matched) for 3+ hours, and a Match stuck at
// awaiting_approval for 3+ hours (the operator forgot to review it, 6.4).

export const NEGLECT_THRESHOLD_HOURS = 3;

export interface NeglectedParentRow {
  id: string;
  whatsappId: string;
  area: string;
  subjects: string[];
  createdAt: Date;
  neglectAlertedAt: Date | null;
}

export interface NeglectedMatchRow {
  id: string;
  tutorName: string;
  parentWhatsappId: string;
  area: string;
  createdAt: Date;
  neglectAlertedAt: Date | null;
}

export interface NeglectDigest {
  parentIds: string[];
  matchIds: string[];
  subject: string;
  html: string;
}

function hoursBetween(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / (1000 * 60 * 60);
}

/** True if this item has been waiting 3+ hours AND either never alerted on
 * before, or the last alert was itself 3+ hours ago — the single rule that
 * implements both "fire at 3h" and "repeat every 3h while still unresolved." */
export function shouldAlert(createdAt: Date, neglectAlertedAt: Date | null, now: Date): boolean {
  if (hoursBetween(now, createdAt) < NEGLECT_THRESHOLD_HOURS) return false;
  if (neglectAlertedAt == null) return true;
  return hoursBetween(now, neglectAlertedAt) >= NEGLECT_THRESHOLD_HOURS;
}

function fmtHours(h: number): string {
  return `${h.toFixed(1)}h`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Builds one digest covering everything currently qualifying for an alert —
 * null when nothing does, so the caller sends no email and touches no rows. */
export function buildNeglectDigest(
  pendingParents: NeglectedParentRow[],
  stuckMatches: NeglectedMatchRow[],
  now: Date,
): NeglectDigest | null {
  const parents = pendingParents
    .filter((p) => shouldAlert(p.createdAt, p.neglectAlertedAt, now))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const matches = stuckMatches
    .filter((m) => shouldAlert(m.createdAt, m.neglectAlertedAt, now))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (parents.length === 0 && matches.length === 0) return null;

  const total = parents.length + matches.length;
  const subject = `⚠️ ${total} item${total === 1 ? "" : "s"} waiting over ${NEGLECT_THRESHOLD_HOURS}h for attention`;

  const parentsHtml =
    parents.length === 0
      ? ""
      : `<h2>Parents waiting (${parents.length})</h2><ul>` +
        parents
          .map(
            (p) =>
              `<li><strong>${escapeHtml(p.whatsappId)}</strong> — ${escapeHtml(p.area)} — ` +
              `${escapeHtml(p.subjects.join(", ") || "subjects not set")} — waiting ${fmtHours(hoursBetween(now, p.createdAt))}</li>`,
          )
          .join("") +
        "</ul>";

  const matchesHtml =
    matches.length === 0
      ? ""
      : `<h2>Matches awaiting your approval (${matches.length})</h2><ul>` +
        matches
          .map(
            (m) =>
              `<li><strong>${escapeHtml(m.tutorName)}</strong> → ${escapeHtml(m.parentWhatsappId)} — ` +
              `${escapeHtml(m.area)} — waiting ${fmtHours(hoursBetween(now, m.createdAt))}</li>`,
          )
          .join("") +
        "</ul>";

  const html = `<p>These haven't gotten a next step in over ${NEGLECT_THRESHOLD_HOURS} hours:</p>${parentsHtml}${matchesHtml}`;

  return {
    parentIds: parents.map((p) => p.id),
    matchIds: matches.map((m) => m.id),
    subject,
    html,
  };
}
