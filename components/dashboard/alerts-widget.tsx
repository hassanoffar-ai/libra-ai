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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Yaxınlaşan və Gecikən Qaytarmalar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Müddəti bitmiş və ya təhvil vaxtı çatan kitab istiqrazları
          </p>
        </div>
        {hasAlerts && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
            {alerts.length} bildiriş
          </span>
        )}
      </div>

      {/* Content or Graceful Empty State */}
      <div className="flex-1 flex flex-col justify-center min-h-[220px]">
        {!hasAlerts ? (
          <div className="text-center py-8 px-4 flex flex-col items-center justify-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">
              Gecikən və ya riskli qaytarma yoxdur
            </h4>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Bütün verilmiş kitablar vaxtında qaytarılıb və ya hazırda müddəti ötən aktiv istiqraz qeydə alınmayıb.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Oxucu</th>
                  <th className="pb-2.5 font-medium">Kitab</th>
                  <th className="pb-2.5 font-medium">Son Tarix</th>
                  <th className="pb-2.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{alert.readerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{alert.readerCard}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 truncate max-w-[180px]">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{alert.bookTitle}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-600">
                      {alert.dueDate}
                    </td>
                    <td className="py-3 pl-2 text-right">
                      {alert.status === "gecikib" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3" />
                          {alert.daysOverdue} gün gecikir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
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

