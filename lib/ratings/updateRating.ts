// Tutor rating running average (CLAUDE.md 6.8 step 2). Pure function — the
// caller reads Tutor.rating/ratingCount, calls this, and writes the result back.

export function nextRatingAverage(
  oldAvg: number,
  oldCount: number,
  newStars: number,
): { rating: number; ratingCount: number } {
  const ratingCount = oldCount + 1;
  const rating = (oldAvg * oldCount + newStars) / ratingCount;
  return { rating, ratingCount };
}
