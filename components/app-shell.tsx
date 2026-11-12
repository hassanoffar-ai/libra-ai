"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Dedicated full-page layouts (reader login, registration, admin login, reader portal & subpages)
  const isDedicatedPage =
    pathname === "/" ||
    pathname === "/register" ||
    pathname === "/admin" ||
    pathname === "/admin/login" ||
    pathname?.startsWith("/admin/") ||
    pathname === "/portal" ||
    pathname?.startsWith("/portal/") ||
    pathname === "/reader" ||
    pathname?.startsWith("/reader/") ||
    pathname?.startsWith("/auth");

  const hasLocalAdmin = typeof window !== "undefined" && localStorage.getItem("libra_admin_session") === "true";
  const isAuthAdmin = Boolean(user) || role === "admin" || (role as string) === "librarian" || hasLocalAdmin;

  // Strict Client-Side Route Guard for Admin Management Pages
  useEffect(() => {
    if (!isDedicatedPage && !isLoading) {
      if (!isAuthAdmin) {
        // Unauthenticated -> redirect strictly to /admin (NEVER to /portal or /auth/login)
        router.replace(`/admin?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
      }
    }
  }, [isAuthAdmin, isLoading, isDedicatedPage, pathname, router]);

  if (isDedicatedPage) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </div>
    );
  }

  // If loading or unauthorized on an admin page, show secure guard loading/blocking state
  // Never leak or flash admin sidebar/content to unauthorized users
  if (isLoading || !isAuthAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-800">Təhlükəsizlik yoxlanılır...</h3>
        <p className="text-xs text-slate-500 mt-1">İcazələr yoxlanılır və idarəetmə panelinə yönləndirilirsiniz.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Top Navigation Bar */}
        <Topbar onToggleMobileSidebar={() => setIsMobileOpen(true)} />

        {/* Page Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

