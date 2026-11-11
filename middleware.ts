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
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get("libra_session")?.value;
  const roleCookie = request.cookies.get("libra_role")?.value;

  const isAuthenticated = Boolean(sessionCookie);
  const isAdmin = roleCookie === "admin";
  const isReader = roleCookie === "oxucu";

  // 1. Protect Admin Management Routes
  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAdminRoute) {
    if (!isAuthenticated) {
      // Not logged in -> redirect to admin login
      const adminLoginUrl = new URL("/admin", request.url);
      adminLoginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    if (!isAdmin) {
      // Logged in as regular reader -> strictly deny access to admin panels
      const readerPortalUrl = new URL("/reader", request.url);
      readerPortalUrl.searchParams.set("denied", "admin_only");
      return NextResponse.redirect(readerPortalUrl);
    }
  }

  // 2. If already logged in as Admin and visiting /admin, redirect to /dashboard
  if (pathname === "/admin") {
    if (isAuthenticated && isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Protect Reader Portal Route
  if (pathname === "/reader") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/kitablar/:path*",
    "/nusxeler/:path*",
    "/inventar/:path*",
    "/oxucular/:path*",
    "/verilme/:path*",
    "/qaytarilma/:path*",
    "/hesabatlar/:path*",
    "/admin",
    "/reader",
  ],
};

