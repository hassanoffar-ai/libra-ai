"use client";

import React, { useState } from "react";
import { Search, Menu, Building2, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const { user, profile, role, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const roleTitle = role === "admin" ? "Administrator" : (profile?.category || "Tələbə");

  const displayName = role === "admin"
    ? "Administrator"
    : profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || user?.displayName || "Oxucu"
    : user?.displayName || "Oxucu";

  const userEmail = profile?.email || user?.email || (role === "admin" ? "admin@ldptm.edu.az" : "");

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E4E0F0] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: Mobile Toggle + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-[#F7F5FC] transition-colors focus:outline-none"
          aria-label="Menyunu aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Axtarış: Kitab adı, Oxucu və ya İnventar №..."
            className="w-full pl-10 pr-12 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all shadow-2xs"
          />
          <div className="hidden sm:flex absolute inset-y-0 right-0 pr-2.5 items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-[#E4E0F0] rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side: Institution badge + Status indicator + Profile avatar */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Institution Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F7F5FC] border border-[#E4E0F0] text-slate-700 shadow-2xs">
          <Building2 className="w-4 h-4 text-violet-700 flex-shrink-0" />
          <span className="text-xs font-semibold tracking-tight whitespace-nowrap text-slate-800">
            Lənkəran Dövlət Peşə Təhsil Mərkəzi
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden xs:inline text-[11px] font-semibold">Onlayn</span>
        </div>

        {/* User Profile / Admin Auth Display */}
        <div className="relative pl-1 sm:pl-2 border-l border-[#E4E0F0]">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-[#F7F5FC] transition-colors focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2E1065] to-[#6D28D9] text-white flex items-center justify-center font-bold text-xs shadow-2xs ring-2 ring-violet-500/20">
              {role === "admin" ? "AD" : getInitials(displayName)}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-violet-700 font-semibold leading-tight">
                {roleTitle}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block group-hover:text-slate-600 transition-colors" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E4E0F0] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 border-b border-[#E4E0F0]">
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  {userEmail && <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>}
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-800 border border-violet-200/50">
                    <ShieldCheck className="w-3 h-3 text-violet-700" />
                    <span>{roleTitle}</span>
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Çıxış et</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
