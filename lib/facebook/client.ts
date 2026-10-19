// Facebook Page Graph API — the 3-hourly tuitions post and, since
// 2026-10-19, one Page Story per tuition (CLAUDE.md 6.5). Plain REST fetch, no
// SDK (Section 4 explicitly rejects facebook-nodejs-business-sdk). No
// third-party SaaS, no Instagram automation.

const GRAPH_VERSION = "v21.0";

interface PostResult {
  ok: boolean;
  postId?: string;
  error?: string;
}

export async function postToFacebookPage(message: string): Promise<PostResult> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) {
    return { ok: false, error: "Facebook Page env vars not configured" };
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, access_token: token }),
    });
    const json = (await res.json()) as { id?: string; error?: { message: string } };
    if (!res.ok) return { ok: false, error: json.error?.message ?? `HTTP ${res.status}` };
    return { ok: true, postId: json.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Posts a PNG as a Facebook Page Story (2026-10-19, Page Stories API): the
 * photo is uploaded unpublished, then published as a story. Same Page token
 * and permissions (pages_manage_posts) as the feed post above. */
export async function postPhotoStoryToFacebookPage(png: Uint8Array<ArrayBuffer>): Promise<PostResult> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) {
    return { ok: false, error: "Facebook Page env vars not configured" };
  }

  try {
    const upload = new FormData();
    upload.append("published", "false");
    upload.append("access_token", token);
    upload.append("source", new Blob([png], { type: "image/png" }), "story.png");
    const photoRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`, { method: "POST", body: upload });
    const photo = (await photoRes.json()) as { id?: string; error?: { message: string } };
    if (!photoRes.ok || !photo.id) return { ok: false, error: `photo upload: ${photo.error?.message ?? `HTTP ${photoRes.status}`}` };

    const storyRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photo_stories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_id: photo.id, access_token: token }),
    });
    const story = (await storyRes.json()) as { success?: boolean; post_id?: string; error?: { message: string } };
    if (!storyRes.ok || !story.success) return { ok: false, error: `story: ${story.error?.message ?? `HTTP ${storyRes.status}`}` };
    return { ok: true, postId: story.post_id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
