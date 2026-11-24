"use client";

import React from "react";
import { AlertCircle, Clock, CheckCircle2, User, BookOpen } from "lucide-react";
import { OverdueAlert } from "@/services/dashboard-service";

interface AlertsWidgetProps {
  alerts: OverdueAlert[];
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <div className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E4E0F0]">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Yaxınlaşan və Gecikən Qaytarmalar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Müddəti bitmiş və ya təhvil vaxtı çatan kitab istiqrazları
          </p>
        </div>
        {hasAlerts && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {alerts.length} bildiriş
          </span>
        )}
      </div>

      {/* Content or Graceful Real Empty State */}
      <div className="flex-1 flex flex-col justify-center min-h-[220px]">
        {!hasAlerts ? (
          <div className="text-center py-8 px-4 flex flex-col items-center justify-center rounded-lg bg-[#F7F5FC] border border-dashed border-[#E4E0F0]">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 mb-3 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Hazırda bazada qeydiyyata alınmış məlumat yoxdur
            </h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Müddəti ötən aktiv istiqraz yoxdur. Oxuculara kitab verildikdə gecikmə və qaytarma tarixləri burada avtomatik monitorinq olunacaq.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F5FC] border-b border-[#E4E0F0] text-[11px] font-bold text-violet-950 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Oxucu</th>
                  <th className="py-2.5 px-3">Kitab</th>
                  <th className="py-2.5 px-3">Son Tarix</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0F0] text-xs text-slate-700">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-[#F7F5FC] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{alert.readerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{alert.readerCard}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900 truncate max-w-[180px]">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{alert.bookTitle}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {alert.dueDate}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {alert.status === "gecikib" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3" />
                          {alert.daysOverdue} gün gecikir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Yaxınlaşır
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
