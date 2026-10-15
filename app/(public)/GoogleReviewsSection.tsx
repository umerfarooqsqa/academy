// Homepage "Rated on Google" section (2026-10-15): the academy's live Google
// Business rating and latest good reviews, from lib/google/reviews.ts (daily
// cached Places API call). Renders nothing until a Place ID is set in
// /website-content and data has been fetched. Reviews are credited to Google
// and to each reviewer, as Google's terms require.

import type { GoogleReviewsData } from "@/lib/google/reviews";

function Stars({ value, size = "text-lg" }: { value: number; size?: string }) {
  const full = Math.round(value);
  return (
    <span className={`${size} leading-none tracking-tight`} aria-label={`${value.toFixed(1)} out of 5 stars`}>
      <span className="text-amber-400">{"★".repeat(full)}</span>
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}

const btn =
  "rounded-full border-2 border-gray-900 px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0_0_#1f2937] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none";

export default function GoogleReviewsSection({ data }: { data: GoogleReviewsData | null }) {
  if (!data || data.rating == null || data.count === 0) return null;
  const reviews = data.reviews.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="text-center">
        <h2 className="font-heading text-sm font-extrabold uppercase tracking-wider text-rose-500">Loved by families</h2>
        <p className="mt-2 font-heading text-3xl font-extrabold text-gray-900 sm:text-4xl">Rated {data.rating.toFixed(1)} on Google</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Stars value={data.rating} size="text-3xl" />
          <span className="text-sm font-semibold text-gray-600">
            {data.count} review{data.count === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {reviews.map((r, i) => (
            <figure key={i} className="flex flex-col rounded-3xl border-2 border-gray-900 bg-white p-6 shadow-[5px_5px_0_0_#1f2937]">
              <Stars value={r.rating} />
              <blockquote className="mt-3 line-clamp-6 text-base leading-relaxed text-gray-700">&ldquo;{r.text}&rdquo;</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-5">
                {r.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoUrl} alt="" width={36} height={36} referrerPolicy="no-referrer" className="h-9 w-9 rounded-full border-2 border-gray-900" />
                )}
                <span className="text-sm">
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 hover:underline">
                      {r.author}
                    </a>
                  ) : (
                    <span className="font-bold text-gray-900">{r.author}</span>
                  )}
                  {r.when && <span className="block text-xs text-gray-500">{r.when}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {data.mapsUrl && (
          <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${btn} bg-white text-gray-900`}>
            See all reviews on Google
          </a>
        )}
        {data.writeReviewUrl && (
          <a href={data.writeReviewUrl} target="_blank" rel="noopener noreferrer" className={`${btn} bg-amber-300 text-gray-900`}>
            ★ Leave us a review
          </a>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">Reviews from Google</p>
    </section>
  );
}
