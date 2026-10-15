"use client";

// Mounted once in the public layout: remembers a campaign tracking link's
// `?ref=` on this device (see campaignRef.ts). Renders nothing.

import { useEffect } from "react";
import { captureRefFromUrl } from "./campaignRef";

export default function CampaignRefCapture() {
  useEffect(() => {
    captureRefFromUrl();
  }, []);
  return null;
}
