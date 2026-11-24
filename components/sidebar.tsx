"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Search,
  BookmarkCheck,
  ClipboardCheck,
  Laptop,
  X,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navItems: NavItem[] = [
  {
    label: "İdarəetmə paneli",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Kitab fondu",
    href: "/kitablar",
    icon: BookOpen,
  },
  {
    label: "Nüsxələr",
    href: "/nusxeler",
    icon: Layers,
  },
  {
    label: "İnventarlaşdırma",
    href: "/inventar",
    icon: ClipboardCheck,
  },
  {
    label: "Elektron kataloq",
    href: "/kataloq",
    icon: Search,
  },
  {
    label: "E-Kitabxana",
    href: "/e-kitabxana",
    icon: Laptop,
  },
  {
    label: "Oxucular",
    href: "/oxucular",
    icon: Users,
  },
  {
    label: "Kitab verilməsi",
    href: "/verilme",
    icon: ArrowUpRight,
  },
  {
    label: "Kitab qaytarılması",
    href: "/qaytarilma",
    icon: ArrowDownLeft,
  },
  {
    label: "Rezervasiyalar",
    href: "/rezervasiyalar",
    icon: BookmarkCheck,
  },
  {
    label: "Hesabatlar",
    href: "/hesabatlar",
    icon: BarChart3,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();
  const isAdmin = role === "admin" || (role as string) === "librarian";

  // Hide all Admin sidebar/navigation links from 'reader' accounts
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#2E1065]/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container: Deep Imperial Purple vertical gradient */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#2E1065] via-[#3B0764] to-[#4C1D95] border-r border-violet-950/40 shadow-2xl transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64 select-none`}
      >
        {/* Sidebar Header / Official Institutional Emblem & Title */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-lg bg-white p-1 border border-white/20 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
              <img
                src="/ldptm-logo.png"
                alt="Lənkəran DPTM Loqo"
                className="w-full h-full object-contain"
              />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col text-left transition-opacity duration-200 min-w-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-white leading-tight truncate">
                  Lənkəran DPTM
                </span>
                <span className="text-[10px] text-violet-200/90 font-medium leading-tight truncate">
                  Elektron Kitabxana
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Menyunu bağla"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-2 pb-2">
            {(!isCollapsed || isMobileOpen) ? (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C4B5FD]/75">
                Rəsmi Menyu
              </span>
            ) : (
              <div className="h-px bg-white/10 my-2" />
            )}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#C4B5FD] font-semibold shadow-xs"
                      : "text-violet-200/80 hover:text-white hover:bg-white/10"
                  } ${isCollapsed && !isMobileOpen ? "justify-center" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-150 ${
                      isActive ? "text-white" : "text-violet-300/80 group-hover:text-white"
                    }`}
                  />

                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}

                  {/* Active indicator dot */}
                  {isActive && (!isCollapsed || isMobileOpen) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C4B5FD]" />
                  )}

                  {/* Tooltip for collapsed mode on hover */}
                  {isCollapsed && !isMobileOpen && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#2E1065] text-white text-xs font-semibold rounded-md shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-violet-800">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Collapse Toggle */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
            title={isCollapsed ? "Menyunu genişləndir" : "Menyunu yığcamlaşdır"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Yığcam görünüş</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
