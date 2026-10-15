import { describe, expect, it } from "vitest";
import { parsePlaceResponse } from "./reviews";

const sample = {
  rating: 4.8,
  userRatingCount: 37,
  googleMapsUri: "https://maps.google.com/?cid=1",
  googleMapsLinks: { writeAReviewUri: "https://search.google.com/local/writereview?placeid=X" },
  reviews: [
    { rating: 5, text: { text: "Found a great chemistry tutor near us! " }, relativePublishTimeDescription: "2 weeks ago",
      authorAttribution: { displayName: "Sana K.", uri: "https://www.google.com/maps/contrib/1", photoUri: "https://lh3.googleusercontent.com/a" } },
    { rating: 2, text: { text: "Took a while." }, authorAttribution: { displayName: "A" } },
    { rating: 5, authorAttribution: { displayName: "No text" } },
  ],
};

describe("parsePlaceResponse", () => {
  it("maps rating, count, links and reviews", () => {
    const d = parsePlaceResponse("PLACE", sample, new Date("2026-10-15T00:00:00Z"));
    expect(d).toMatchObject({ placeId: "PLACE", rating: 4.8, count: 37, mapsUrl: sample.googleMapsUri, writeReviewUrl: sample.googleMapsLinks.writeAReviewUri });
    expect(d.reviews).toEqual([
      { author: "Sana K.", authorUrl: "https://www.google.com/maps/contrib/1", photoUrl: "https://lh3.googleusercontent.com/a", rating: 5, text: "Found a great chemistry tutor near us!", when: "2 weeks ago" },
    ]);
  });

  it("only keeps written reviews of 4+ stars", () => {
    expect(parsePlaceResponse("P", sample).reviews.map((r) => r.author)).toEqual(["Sana K."]);
  });

  it("copes with an empty response", () => {
    expect(parsePlaceResponse("P", {})).toMatchObject({ rating: null, count: 0, reviews: [] });
  });
});
