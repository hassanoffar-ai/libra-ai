"use client";

import React from "react";
import {
  BookOpen,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  AlertTriangle,
  Users,
} from "lucide-react";
import { DashboardStats } from "@/services/dashboard-service";

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: "Ümumi kitab fondu",
      subtitle: "Unikal adlar",
      value: stats.totalTitles,
      icon: BookOpen,
      iconColor: "text-violet-700 bg-violet-50 border-violet-200/70",
      badge: stats.totalTitles === 0 ? "Bazada qeyd yoxdur" : `${stats.totalTitles} adda kitab`,
      badgeColor: "bg-slate-100 text-slate-700",
    },
    {
      title: "Fiziki nüsxələr",
      subtitle: "Bütün nüsxələr",
      value: stats.totalCopies,
      icon: Layers,
      iconColor: "text-purple-700 bg-purple-50 border-purple-200/70",
      badge: stats.totalCopies === 0 ? "0 inventar" : `${stats.totalCopies} fiziki nüsxə`,
      badgeColor: "bg-slate-100 text-slate-700",
    },
    {
      title: "Mövcud nüsxələr",
      subtitle: "Rəfdə / İstiqraz üçün hazır",
      value: stats.availableCopies,
      icon: CheckCircle2,
      iconColor: "text-emerald-700 bg-emerald-50 border-emerald-200/70",
      badge: stats.availableCopies === 0 ? "Mövcud nüsxə yoxdur" : "Təhvilə hazır",
      badgeColor: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
    },
    {
      title: "Verilmiş nüsxələr",
      subtitle: "Oxucularda aktiv",
      value: stats.borrowedCopies,
      icon: ArrowUpRight,
      iconColor: "text-indigo-700 bg-indigo-50 border-indigo-200/70",
      badge: stats.borrowedCopies === 0 ? "Aktiv istiqraz yoxdur" : "Dövriyyədə",
      badgeColor: "bg-violet-50 text-violet-800 border border-violet-200/60",
    },
    {
      title: "Gecikdirilmiş nüsxələr",
      subtitle: "Müddəti ötən kitablar",
      value: stats.overdueCopies,
      icon: AlertTriangle,
      iconColor: stats.overdueCopies > 0 
        ? "text-rose-700 bg-rose-50 border-rose-200" 
        : "text-amber-700 bg-amber-50 border-amber-200/70",
      badge: stats.overdueCopies > 0 ? "Təcili tədbir tələb olunur" : "Gecikmə yoxdur",
      badgeColor: stats.overdueCopies > 0 
        ? "bg-rose-50 text-rose-800 border border-rose-200" 
        : "bg-slate-100 text-slate-700",
    },
    {
      title: "Qeydiyyatda olan oxucular",
      subtitle: "Tələbə və müəllimlər",
      value: stats.totalReaders,
      icon: Users,
      iconColor: "text-sky-700 bg-sky-50 border-sky-200/70",
      badge: stats.totalReaders === 0 ? "0 qeydiyyat" : `${stats.totalReaders} aktiv üzv`,
      badgeColor: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {card.subtitle}
                </p>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {card.title}
                </h3>
              </div>
              <div
                className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${card.iconColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-2 flex items-baseline justify-between gap-2 border-t border-[#E4E0F0]">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {card.value.toLocaleString("az-AZ")}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
