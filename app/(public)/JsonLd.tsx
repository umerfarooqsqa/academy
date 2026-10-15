// Renders structured data blocks (lib/seo/jsonLd.ts). Server component.

import { ldJson } from "@/lib/seo/jsonLd";

export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] | null }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(data) }} />;
}
