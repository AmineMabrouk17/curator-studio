import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/study/:path*", "/api/studies/:path*"],
};

export default async function middleware(request: NextRequest) {
  const session = await readSession(request);
  if (session) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}