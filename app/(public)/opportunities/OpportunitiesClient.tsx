"use client";

// Public, unauthenticated (CLAUDE.md Section 7). Tutors browse open tuitions
// and tap "I'm interested" right here (2026-10-14 — replaces "message us and
// mention the code"): they type their WhatsApp number and
// POST /api/public/opportunity-interest records it for a registered tutor.
// No parent contact info is ever shown.
//
// "Show tuitions near me" is opt-in browser geolocation (or "pick your
// area" — shared useNearMe/NearMeControls, 2026-10-15); distance and the
// near/further split are computed in the browser (lib/opportunities/nearby.ts,
// same within-the-zone's-maxKm rule as matching) against zone centroids — the
// tutor's location never leaves the device.

import { useMemo, useState } from "react";
import Link from "next/link";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { formatOpportunityCopyText, type OpportunityListing } from "@/lib/opportunities/formatText";
import { nearbyStatus } from "@/lib/opportunities/nearby";
import Lili from "../Lili";
import { useNearMe, type NearMeArea } from "../useNearMe";
import NearMeControls from "../NearMeControls";
import { chipActiveClass, chipClass, inputClass, linkClass, primaryClass, secondaryClass } from "../liliStyles";

type Located = OpportunityListing & { near: boolean; distanceKm?: number };

function groupLabel(g: string) {
  return SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g;
}

function postedAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

export default function OpportunitiesClient({ listings, areas }: { listings: OpportunityListing[]; areas: NearMeArea[] }) {
  const nearMe = useNearMe();
  const location = nearMe.location ? { lat: nearMe.location.lat, lon: nearMe.location.lon } : null;
  const locationError = nearMe.error;
  const [group, setGroup] = useState<string>("all");
  const [showFurther, setShowFurther] = useState(false);

  const groups = useMemo(() => [...new Set(listings.map((l) => l.subjectGroup))], [listings]);
  const filtered = useMemo(() => (group === "all" ? listings : listings.filter((l) => l.subjectGroup === group)), [listings, group]);

  const located: Located[] = useMemo(() => {
    if (!location) return [];
    return filtered
      .map((l) => ({ ...l, ...nearbyStatus(l, location.lat, location.lon) }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [filtered, location]);
  const near = located.filter((l) => l.near);
  const further = located.filter((l) => !l.near);

  let line: string;
  if (listings.length === 0) line = "No open tuitions right now — register and I'll match you directly when one comes in.";
  else if (locationError) line = "No problem — here are all the open tuitions. You can also pick your area below the button.";
  else if (!location) line = "These students need a tutor right now! Share your location and I'll show you the ones near you.";
  else if (near.length > 0)
    line = `I found ${near.length} tuition${near.length === 1 ? "" : "s"} near you! 🎉 Tap "I'm interested" on any you'd like.`;
  else line = "Nothing near you right now — register and we'll match you as soon as one comes in.";

  return (
    <div>
      <h1 className="text-center font-heading text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Tuitions near you
      </h1>

      <div className="mx-auto mt-6 flex max-w-2xl items-end gap-3 sm:gap-4">
        <Lili className="w-16 shrink-0 sm:w-20" />
        <div className="relative mb-4 flex-1 rounded-2xl border-2 border-gray-900 bg-amber-50 px-4 py-3 text-base font-semibold leading-snug text-gray-900 shadow-[3px_3px_0_0_#1f2937]">
          <span aria-hidden className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-gray-900 bg-amber-50" />
          <span aria-live="polite">{line}</span>
        </div>
      </div>

      {listings.length > 0 ? (
        <div className="text-center">
          <NearMeControls
            nearMe={nearMe}
            areas={areas}
            buttonLabel="📍 Show tuitions near me"
            locatedLabel={nearMe.location?.pickedArea ? `Showing tuitions near ${nearMe.location.pickedArea}` : "Showing tuitions near you"}
          />
        </div>
      ) : (
        <div className="mt-2 flex justify-center">
          <Link href="/become-a-tutor" className={primaryClass}>
            Become a tutor
          </Link>
        </div>
      )}

      {groups.length > 1 && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button type="button" className={group === "all" ? chipActiveClass : chipClass} onClick={() => setGroup("all")}>
            All
          </button>
          {groups.map((g) => (
            <button key={g} type="button" className={group === g ? chipActiveClass : chipClass} onClick={() => setGroup(g)}>
              {groupLabel(g)}
            </button>
          ))}
        </div>
      )}

      {location ? (
        <>
          <Section title={`Near you (${near.length})`} listings={near} empty="Nothing in this category near you yet." />
          {further.length > 0 && (
            <div className="mt-10 text-center">
              <button type="button" className={secondaryClass} onClick={() => setShowFurther((s) => !s)}>
                {showFurther ? "Hide" : "Show"} {further.length} further away
              </button>
              {showFurther && <Section title="Further away" listings={further} />}
            </div>
          )}
        </>
      ) : (
        filtered.length > 0 && <Section title={`Open tuitions (${filtered.length})`} listings={filtered} />
      )}

      <p className="mt-12 text-center text-sm text-gray-600">
        New tutor?{" "}
        <Link href="/become-a-tutor" className="font-bold text-gray-900 underline decoration-rose-400 decoration-2 underline-offset-4">
          Register first
        </Link>{" "}
        — it takes 3 minutes.
      </p>
    </div>
  );
}

function Section({ title, listings, empty }: { title: string; listings: (OpportunityListing & { distanceKm?: number })[]; empty?: string }) {
  return (
    <section className="mt-8 text-left">
      <h2 className="font-heading text-xl font-extrabold text-gray-900">{title}</h2>
      {listings.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{empty}</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <OpportunityCard key={l.opportunityCode} listing={l} />
          ))}
        </div>
      )}
    </section>
  );
}

type InterestState =
  | { step: "idle" }
  | { step: "form"; number: string; error?: string; sending?: boolean }
  | { step: "done"; outcome: "claimed" | "pending" | "unregistered" | "taken"; message: string };

function OpportunityCard({ listing }: { listing: OpportunityListing & { distanceKm?: number } }) {
  const [interest, setInterest] = useState<InterestState>({ step: "idle" });
  const [shared, setShared] = useState(false);
  const online = listing.deliveryMode === "online";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (interest.step !== "form") return;
    setInterest({ ...interest, sending: true, error: undefined });
    try {
      const res = await fetch("/api/public/opportunity-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityCode: listing.opportunityCode, whatsappNumber: interest.number }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setInterest({ ...interest, sending: false, error: body.error ?? "Something went wrong — please try again." });
      else setInterest({ step: "done", outcome: body.outcome, message: body.message });
    } catch {
      setInterest({ ...interest, sending: false, error: "Something went wrong — please try again." });
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(formatOpportunityCopyText(listing, `${window.location.origin}/opportunities`));
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Clipboard unavailable (older browser / insecure context) — nothing to do.
    }
  }

  return (
    <article className="flex flex-col rounded-3xl border-2 border-gray-900 bg-white p-5 shadow-[4px_4px_0_0_#1f2937]">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border-2 border-gray-900 bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-gray-900">
          {groupLabel(listing.subjectGroup)}
        </span>
        <span className="text-xs text-gray-400" suppressHydrationWarning>
          {postedAgo(listing.publishedAt)}
        </span>
      </div>
      <h3 className="mt-3 font-heading text-xl font-extrabold leading-tight text-gray-900">
        {listing.subjects.join(", ") || "Tutor needed"}
      </h3>
      <p className="mt-0.5 text-sm text-gray-600">{listing.curriculum}</p>
      <p className="mt-3 text-sm font-semibold text-gray-800">
        {online ? "💻 Online" : `📍 ${listing.area}`}
        {listing.distanceKm != null && <span className="text-rose-600"> · ~{listing.distanceKm.toFixed(1)} km</span>}
        {listing.deliveryMode === "both" && <span className="font-normal text-gray-500"> · or online</span>}
      </p>

      <div className="mt-auto pt-4">
        {interest.step === "idle" && (
          <button type="button" className={`${primaryClass} w-full`} onClick={() => setInterest({ step: "form", number: "" })}>
            I&apos;m interested
          </button>
        )}
        {interest.step === "form" && (
          <form onSubmit={submit} className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700" htmlFor={`wa-${listing.opportunityCode}`}>
              Your WhatsApp number
            </label>
            <div className="flex gap-2">
              <input
                id={`wa-${listing.opportunityCode}`}
                type="tel"
                autoFocus
                className={`${inputClass} py-2`}
                placeholder="0300 1234567"
                value={interest.number}
                onChange={(e) => setInterest({ step: "form", number: e.target.value })}
              />
              <button type="submit" className={`${primaryClass} shrink-0`} disabled={interest.sending}>
                {interest.sending ? "…" : "Send"}
              </button>
            </div>
            {interest.error && <p className="text-xs font-semibold text-red-600">{interest.error}</p>}
            <button type="button" className={`${linkClass} self-start text-xs`} onClick={() => setInterest({ step: "idle" })}>
              Cancel
            </button>
          </form>
        )}
        {interest.step === "done" && (
          <div
            className={`rounded-2xl border-2 border-gray-900 px-3 py-2.5 text-sm font-semibold ${
              interest.outcome === "claimed" ? "bg-teal-100" : interest.outcome === "taken" ? "bg-gray-100" : "bg-amber-100"
            }`}
          >
            {interest.message}
            {interest.outcome === "unregistered" && (
              <Link href="/become-a-tutor" className={`${primaryClass} mt-2 block text-center`}>
                Become a tutor
              </Link>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>Ref {listing.opportunityCode}</span>
          <button type="button" className="font-bold hover:text-gray-900" onClick={share}>
            {shared ? "Copied!" : "Share"}
          </button>
        </div>
      </div>
    </article>
  );
}
