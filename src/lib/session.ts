import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { signSession, verifySession, type SessionPayload } from "./crypto";
import { MEMBER_COOKIE, SAFE_MEMBER_SELECT, type SafeMember } from "./members";

export type { SafeMember };
export { MEMBER_COOKIE, SAFE_MEMBER_SELECT };

const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/** Route Handler that clears an invalidated cookie, then redirects to /whoami. */
const STALE_SESSION_PATH = "/api/session/expire";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** Issue a signed session cookie for a freshly-authenticated member. */
export async function createSession(member: { id: number; sessionVersion: number }) {
  const token = signSession({
    m: member.id,
    v: member.sessionVersion,
    iat: Math.floor(Date.now() / 1000),
  });
  const store = await cookies();
  store.set(MEMBER_COOKIE, token, cookieOptions());
}

export async function destroySession() {
  const store = await cookies();
  store.delete(MEMBER_COOKIE);
}

/**
 * Optimistic, cookie-only session check (no DB). Memoized per request.
 * Use for cheap gating; use {@link requireMember} before touching data.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  return verifySession(store.get(MEMBER_COOKIE)?.value);
});

/**
 * Verifies the signed cookie *and* that the session has not been invalidated
 * server-side (sessionVersion). Redirects to /whoami when unauthenticated.
 * Memoized per request so layout + page + leaf components share one DB read.
 *
 * Prefer {@link requireMember}: this variant does NOT enforce a pending forced
 * PIN change, and exists for /set-pin, which would otherwise redirect to itself.
 */
export const loadMember = cache(
  async (): Promise<SafeMember & { mustChangePin: boolean }> => {
    const session = await getSession();
    if (!session) redirect("/whoami");

    const member = await prisma.member.findUnique({
      where: { id: session.m },
      select: {
        ...SAFE_MEMBER_SELECT,
        sessionVersion: true,
        mustChangePin: true,
      },
    });
    // Not /whoami: the cookie is validly signed, so `proxy.ts` would bounce it
    // straight back here and loop. This route clears the cookie first.
    if (!member || member.sessionVersion !== session.v) {
      redirect(STALE_SESSION_PATH);
    }

    const { sessionVersion: _sessionVersion, ...rest } = member;
    void _sessionVersion;
    return rest;
  }
);

/**
 * The Data Access Layer entry point. As {@link loadMember}, but a member whose
 * PIN was reset by a flatmate is held at /set-pin until they choose a new one —
 * enforced here rather than in `proxy.ts` so it cannot be skipped by any page,
 * Server Action or route that reads the session.
 */
export const requireMember = cache(async (): Promise<SafeMember> => {
  const { mustChangePin, ...safe } = await loadMember();
  if (mustChangePin) redirect("/set-pin");
  return safe;
});
