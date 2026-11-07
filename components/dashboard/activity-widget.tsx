"use client";

import React from "react";
import { History, ArrowUpRight, ArrowDownLeft, BookOpen, Clock } from "lucide-react";
import { RecentActivity } from "@/services/dashboard-service";

interface ActivityWidgetProps {
  activities: RecentActivity[];
}

export function ActivityWidget({ activities }: ActivityWidgetProps) {
  const hasActivities = activities && activities.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            Son Əməliyyatlar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kitabxana fondunun son hərəkət jurnalı
          </p>
        </div>
        {hasActivities && (
          <span className="text-xs text-slate-400 font-medium">
            Son {activities.length} qeyd
          </span>
        )}
      </div>

      {/* Content or Graceful Empty State */}
      <div className="flex-1 flex flex-col justify-center min-h-[220px]">
        {!hasActivities ? (
          <div className="text-center py-8 px-4 flex flex-col items-center justify-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
              <History className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">
              Hələlik heç bir əməliyyat qeydə alınmayıb
            </h4>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Oxuculara kitab verildikdə və ya geri qaytarıldıqda bütün əməliyyat tarixçəsi anbaan bu jurnalda görünəcək.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => {
              const isBorrow = act.action === "verilme";
              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isBorrow
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}
                    >
                      {isBorrow ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        <span className="text-slate-900">{act.readerName}</span>
                        <span className="text-slate-400 font-normal ml-1">
                          {isBorrow ? "kitabı götürdü" : "kitabı qaytardı"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                        <BookOpen className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{act.bookTitle}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {act.inventoryNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono flex-shrink-0">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span>{act.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

