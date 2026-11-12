import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that strictly require Admin privileges
const ADMIN_ONLY_ROUTES = [
  "/dashboard",
  "/kitablar",
  "/nusxeler",
  "/inventar",
  "/kataloq",
  "/e-kitabxana",
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
  const adminSessionCookie = request.cookies.get("libra_admin_session")?.value;
  const readerCookie = request.cookies.get("libra_reader_session")?.value;

  const isAuthenticatedAdmin =
    (Boolean(sessionCookie) && (roleCookie === "admin" || roleCookie === "librarian")) ||
    adminSessionCookie === "true";
  const isReaderAuthenticated = Boolean(readerCookie);

  // 1. Protect Admin Management Routes (/dashboard, /kitablar, /oxucular, etc.)
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAdminRoute) {
    if (!isAuthenticatedAdmin) {
      // Unauthenticated admin -> redirect strictly to /admin/login (NEVER to /portal)
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Admin Login Routes (/admin, /admin/login, /auth/admin)
  if (
    pathname === "/admin" ||
    pathname === "/admin/login" ||
    pathname === "/auth/admin"
  ) {
    if (isAuthenticatedAdmin) {
      // Already logged in as Admin -> go to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname === "/admin" || pathname === "/auth/admin") {
      // Normalize to /admin/login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // Allow /admin/login to render cleanly; NEVER redirect to /portal!
    return NextResponse.next();
  }

  // 3. Protect Reader Portal Routes (/portal, /portal/*, /reader, /reader/*)
  if (
    pathname === "/portal" ||
    pathname.startsWith("/portal/") ||
    pathname === "/reader" ||
    pathname.startsWith("/reader/")
  ) {
    if (!isReaderAuthenticated && !isAuthenticatedAdmin) {
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
    "/kataloq",
    "/kataloq/:path*",
    "/e-kitabxana",
    "/e-kitabxana/:path*",
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
    "/auth/admin",
    "/auth/admin/:path*",
    "/portal",
    "/portal/:path*",
    "/reader",
    "/reader/:path*",
  ],
};
