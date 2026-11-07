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
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
      badge: stats.totalTitles === 0 ? "Bazada qeyd yoxdur" : `${stats.totalTitles} adda kitab`,
      badgeColor: "bg-slate-100 text-slate-600",
    },
    {
      title: "Fiziki nüsxələr",
      subtitle: "Bütün nüsxələr",
      value: stats.totalCopies,
      icon: Layers,
      iconColor: "text-blue-600 bg-blue-50 border-blue-100",
      badge: stats.totalCopies === 0 ? "0 inventar" : `${stats.totalCopies} fiziki nüsxə`,
      badgeColor: "bg-slate-100 text-slate-600",
    },
    {
      title: "Mövcud nüsxələr",
      subtitle: "Rəfdə / İstiqraz üçün hazır",
      value: stats.availableCopies,
      icon: CheckCircle2,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
      badge: stats.availableCopies === 0 ? "Mövcud nüsxə yoxdur" : "Təhvilə hazır",
      badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    },
    {
      title: "Verilmiş nüsxələr",
      subtitle: "Oxucularda aktiv",
      value: stats.borrowedCopies,
      icon: ArrowUpRight,
      iconColor: "text-violet-600 bg-violet-50 border-violet-100",
      badge: stats.borrowedCopies === 0 ? "Aktiv istiqraz yoxdur" : "Dövriyyədə",
      badgeColor: "bg-violet-50 text-violet-700 border border-violet-200/60",
    },
    {
      title: "Gecikdirilmiş nüsxələr",
      subtitle: "Müddəti ötən kitablar",
      value: stats.overdueCopies,
      icon: AlertTriangle,
      iconColor: stats.overdueCopies > 0 
        ? "text-rose-600 bg-rose-50 border-rose-200" 
        : "text-amber-600 bg-amber-50 border-amber-100",
      badge: stats.overdueCopies > 0 ? "Təcili tədbir tələb olunur" : "Gecikmə yoxdur",
      badgeColor: stats.overdueCopies > 0 
        ? "bg-rose-50 text-rose-700 border border-rose-200" 
        : "bg-slate-100 text-slate-600",
    },
    {
      title: "Qeydiyyatda olan oxucular",
      subtitle: "Tələbə və müəllimlər",
      value: stats.totalReaders,
      icon: Users,
      iconColor: "text-sky-600 bg-sky-50 border-sky-100",
      badge: stats.totalReaders === 0 ? "0 qeydiyyat" : `${stats.totalReaders} aktiv üzv`,
      badgeColor: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.subtitle}
                </p>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                  {card.title}
                </h3>
              </div>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${card.iconColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-2 flex items-baseline justify-between gap-2 border-t border-slate-100">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.value.toLocaleString("az-AZ")}
              </span>
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${card.badgeColor}`}
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

