"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Library,
  Search,
  BookmarkCheck,
  ClipboardCheck,
  Laptop,
  Sparkles,
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0F172A] border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64 select-none`}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-950/50 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Library className="w-5 h-5" />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col text-left transition-opacity duration-200">
                <span className="text-sm font-bold tracking-tight text-white font-sans leading-tight">
                  Peşə Kitabxanası
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  Lənkəran DPTM
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Menyunu bağla"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2">
            {(!isCollapsed || isMobileOpen) ? (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Əsas Menyu
              </span>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
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
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/50"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                  } ${isCollapsed && !isMobileOpen ? "justify-center" : ""}`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />

                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}

                  {/* Active subtle pill indicator for expanded */}
                  {isActive && (!isCollapsed || isMobileOpen) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-200" />
                  )}

                  {/* Tooltip for collapsed mode on hover */}
                  {isCollapsed && !isMobileOpen && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-slate-100 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-slate-700">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80">
          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors text-xs font-medium"
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

