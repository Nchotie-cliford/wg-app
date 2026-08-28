import { NextResponse, type NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname === "/whoami") {
    return NextResponse.next();
  }
  if (request.cookies.get("wg_auth")?.value !== "ok") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!request.cookies.get("wg_member")?.value) {
    return NextResponse.redirect(new URL("/whoami", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)"],
};
