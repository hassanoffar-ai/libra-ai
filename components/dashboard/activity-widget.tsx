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
    <div className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E4E0F0]">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-violet-700" />
            Son Əməliyyatlar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kitabxana fondunun son hərəkət jurnalı
          </p>
        </div>
        {hasActivities && (
          <span className="text-xs text-slate-500 font-semibold">
            Son {activities.length} qeyd
          </span>
        )}
      </div>

      {/* Content or Graceful Real Empty State */}
      <div className="flex-1 flex flex-col justify-center min-h-[220px]">
        {!hasActivities ? (
          <div className="text-center py-8 px-4 flex flex-col items-center justify-center rounded-lg bg-[#F7F5FC] border border-dashed border-[#E4E0F0]">
            <div className="w-12 h-12 rounded-lg bg-violet-50 border border-violet-200/70 flex items-center justify-center text-violet-700 mb-3 shadow-2xs">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Hazırda bazada qeydiyyata alınmış məlumat yoxdur
            </h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Oxuculara kitab verildikdə və ya geri qaytarıldıqda bütün əməliyyat tarixçəsi anbaan bu rəsmi jurnalda əks olunacaq.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => {
              const isBorrow = act.action === "verilme";
              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-[#F7F5FC] transition-colors border border-transparent hover:border-[#E4E0F0]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isBorrow
                          ? "bg-violet-50 text-violet-700 border border-violet-200/70"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                      }`}
                    >
                      {isBorrow ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        <span>{act.readerName}</span>
                        <span className="text-slate-500 font-normal ml-1">
                          {isBorrow ? "kitabı götürdü" : "kitabı qaytardı"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                        <BookOpen className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{act.bookTitle}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {act.inventoryNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono flex-shrink-0">
                    <Clock className="w-3 h-3 text-slate-400" />
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
