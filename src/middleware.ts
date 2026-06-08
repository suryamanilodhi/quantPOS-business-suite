import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/register", "/forgot-password", "/api/auth/login", "/api/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isAsset = pathname.startsWith("/_next") || pathname.includes(".");
  if (isPublic || isAsset) return NextResponse.next();

  const isAuthed = Boolean(request.cookies.get("quantpos_token")?.value);
  if (!isAuthed && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!isAuthed && pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
