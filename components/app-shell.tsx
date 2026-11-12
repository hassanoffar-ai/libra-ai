"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Dedicated full-page layouts (reader login, registration, admin login, reader portal & subpages)
  const isDedicatedPage =
    pathname === "/" ||
    pathname === "/register" ||
    pathname === "/admin" ||
    pathname === "/reader" ||
    pathname?.startsWith("/reader/") ||
    pathname?.startsWith("/auth");

  if (isDedicatedPage) {
    const isLandingPage = pathname === "/";
    return (
      <div
        className={`min-h-screen text-slate-800 antialiased selection:bg-indigo-500 selection:text-white ${
          isLandingPage ? "" : "bg-[#F8FAFC]"
        }`}
      >
        {children}
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

