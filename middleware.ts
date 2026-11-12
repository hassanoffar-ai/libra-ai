import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that strictly require Admin privileges
const ADMIN_ONLY_ROUTES = [
  "/dashboard",
  "/kitablar",
  "/nusxeler",
  "/inventar",
  "/oxucular",
  "/verilme",
  "/qaytarilma",
  "/hesabatlar",
  "/rezervasiyalar",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get("libra_session")?.value;
  const roleCookie = request.cookies.get("libra_role")?.value;

  const isAuthenticated = Boolean(sessionCookie);
  const isAdmin = roleCookie === "admin" || roleCookie === "librarian";

  // 1. Protect Admin Management Routes
  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAdminRoute) {
    if (!isAuthenticated) {
      // Unauthenticated -> redirect to /auth/login as required
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin) {
      // Logged in as regular reader -> strictly block access and redirect to /portal
      const readerPortalUrl = new URL("/portal", request.url);
      readerPortalUrl.searchParams.set("denied", "admin_only");
      return NextResponse.redirect(readerPortalUrl);
    }
  }

  // 2. Admin Login Route (/admin) Access Control
  if (pathname === "/admin") {
    if (isAuthenticated) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        // Authenticated as reader -> block access to /admin and redirect to reader portal
        const readerPortalUrl = new URL("/portal", request.url);
        readerPortalUrl.searchParams.set("denied", "admin_only");
        return NextResponse.redirect(readerPortalUrl);
      }
    }
  }

  // 3. Protect Reader Portal Routes (/portal, /reader)
  if (
    pathname === "/portal" ||
    pathname.startsWith("/portal/") ||
    pathname === "/reader" ||
    pathname.startsWith("/reader/")
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/kitablar",
    "/kitablar/:path*",
    "/nusxeler",
    "/nusxeler/:path*",
    "/inventar",
    "/inventar/:path*",
    "/oxucular",
    "/oxucular/:path*",
    "/verilme",
    "/verilme/:path*",
    "/qaytarilma",
    "/qaytarilma/:path*",
    "/hesabatlar",
    "/hesabatlar/:path*",
    "/rezervasiyalar",
    "/rezervasiyalar/:path*",
    "/admin",
    "/admin/:path*",
    "/portal",
    "/portal/:path*",
    "/reader",
    "/reader/:path*",
  ],
};

