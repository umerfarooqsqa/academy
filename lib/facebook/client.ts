// Facebook Page Graph API — daily opportunities digest (CLAUDE.md 6.5). Plain
// REST fetch, no SDK (Section 4 explicitly rejects facebook-nodejs-business-sdk
// for this one endpoint). No third-party SaaS, no Instagram automation.

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
