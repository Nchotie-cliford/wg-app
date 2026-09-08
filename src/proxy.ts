import { NextResponse, type NextRequest } from "next/server";
import { MEMBER_COOKIE } from "@/lib/members";
import { verifySession } from "@/lib/crypto";

/**
 * Optimistic auth gate. Only verifies the *signature* of the session cookie —
 * no database work (per the Next.js auth guidance, the real check happens in
 * `requireMember()` at the data layer). A forged or tampered cookie fails the
 * HMAC check here and the user is bounced to the picker.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(MEMBER_COOKIE)?.value;
  const session = verifySession(token);

  if (pathname === "/whoami") {
    if (session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!session) {
    const res = NextResponse.redirect(new URL("/whoami", request.url));
    if (token) res.cookies.delete(MEMBER_COOKIE); // drop a stale/invalid cookie
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes (they authorize themselves), Next internals, and static assets.
  matcher: [
    "/((?!api|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webmanifest|json|txt)).*)",
  ],
};
