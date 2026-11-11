"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, Building2, User, ChevronDown, LogOut, LogIn, Sparkles } from "lucide-react";
import { getCurrentReader, logoutReader } from "@/services/auth-service";
import { Reader } from "@/services/circulation-service";

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const [currentReader, setCurrentReader] = useState<Reader | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const updateReader = () => {
      setCurrentReader(getCurrentReader());
    };
    updateReader();

    window.addEventListener("libra-auth-changed", updateReader);
    return () => window.removeEventListener("libra-auth-changed", updateReader);
  }, []);

  const handleLogout = () => {
    logoutReader();
    setIsDropdownOpen(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return "OX";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: Mobile Toggle + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
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
            className="w-full pl-10 pr-12 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
          />
          <div className="hidden sm:flex absolute inset-y-0 right-0 pr-2.5 items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side: Institution badge + Status indicator + Profile avatar */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Institution Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 shadow-2xs">
          <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="text-xs font-medium tracking-tight whitespace-nowrap">
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

        {/* User Profile / Reader Auth Display */}
        <div className="relative pl-1 sm:pl-2 border-l border-slate-200">
          {currentReader ? (
            <div>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-indigo-500/30">
                  {getInitials(`${currentReader.firstName} ${currentReader.lastName}`)}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentReader.firstName} {currentReader.lastName}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium leading-tight">
                    {currentReader.ticketNumber} • {currentReader.category}
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentReader.firstName} {currentReader.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentReader.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                        {currentReader.ticketNumber}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Çıxış et</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Giriş</span>
              </Link>
              <Link
                href="/auth/register"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-600/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Qeydiyyat</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
