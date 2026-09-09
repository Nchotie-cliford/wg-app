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
 * The Data Access Layer entry point. Verifies the signed cookie *and* that the
 * session has not been invalidated server-side (sessionVersion), then returns a
 * safe projection of the member. Redirects to /whoami when unauthenticated.
 * Memoized per request so layout + page + leaf components share one DB read.
 */
export const requireMember = cache(async (): Promise<SafeMember> => {
  const session = await getSession();
  if (!session) redirect("/whoami");

  const member = await prisma.member.findUnique({
    where: { id: session.m },
    select: { ...SAFE_MEMBER_SELECT, sessionVersion: true },
  });
  if (!member || member.sessionVersion !== session.v) redirect("/whoami");

  const { sessionVersion: _sessionVersion, ...safe } = member;
  void _sessionVersion;
  return safe;
});
