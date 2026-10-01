import { NextResponse } from "next/server";
import { MEMBER_COOKIE } from "@/lib/members";

export const dynamic = "force-dynamic";

/**
 * Clears a session cookie that is correctly signed but no longer valid — the
 * member's `sessionVersion` moved on (PIN change, flatmate reset) or the row is
 * gone. `proxy.ts` cannot detect that: it only checks the HMAC, with no database
 * access, so to it the cookie still looks good and it bounces /whoami back to /.
 * A Server Component cannot delete a cookie either, so the data layer redirects
 * here — a Route Handler, which can — and we land the user on the picker with a
 * clean slate. Without this hop, an invalidated session is an endless
 * / -> /whoami -> / redirect loop and the member can never reach the PIN prompt.
 *
 * Lives under /api so the proxy matcher skips it (an expired cookie must not be
 * redirected away from the very route that clears it).
 */
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/whoami", request.url));
  res.cookies.delete(MEMBER_COOKIE);
  return res;
}
