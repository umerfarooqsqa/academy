import { describe, it, expect, beforeEach, vi } from "vitest";

describe("auth (multi-user session tokens — 2026-10 planning session)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-session-secret";
  });

  it("issues a session token that verifies and round-trips the user id and role", async () => {
    const { createSessionToken, verifySessionToken } = await import("@/lib/auth");
    const token = await createSessionToken("user-1", "admin");
    const session = await verifySessionToken(token);
    expect(session).toEqual({ userId: "user-1", role: "admin" });
  });

  it("preserves a staff role distinctly from admin", async () => {
    const { createSessionToken, verifySessionToken } = await import("@/lib/auth");
    const token = await createSessionToken("user-2", "staff");
    const session = await verifySessionToken(token);
    expect(session?.role).toBe("staff");
  });

  it("rejects an expired session token", async () => {
    const { createSessionToken, verifySessionToken } = await import("@/lib/auth");
    const token = await createSessionToken("user-1", "admin", 0); // issued at epoch 0 -> long expired
    expect(await verifySessionToken(token, Date.now())).toBeNull();
  });

  it("rejects a tampered token (role flipped without re-signing)", async () => {
    const { createSessionToken, verifySessionToken } = await import("@/lib/auth");
    const token = await createSessionToken("user-1", "staff");
    const [userId, , expiry, signature] = token.split(".");
    const tampered = `${userId}.admin.${expiry}.${signature}`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects a garbage/malformed token", async () => {
    const { verifySessionToken } = await import("@/lib/auth");
    expect(await verifySessionToken("not-a-real-token")).toBeNull();
    expect(await verifySessionToken(null)).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
  });
});
