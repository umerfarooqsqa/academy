// Resend email client (neglected-parent alerts — chosen specifically to avoid
// spending WhatsApp's cost budget on an internal operator notification, per
// CLAUDE.md Section 1's WhatsApp-pricing-risk discussion). Plain fetch, no SDK —
// matches this codebase's established pattern for single-endpoint third-party
// integrations (see lib/facebook/client.ts, lib/storage/supabase.ts). Guarded
// the same way every other outbound client here is: never throws, returns
// {ok, error} so a failed send can't take down the caller.

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      return { ok: false, error: json.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, id: json.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
