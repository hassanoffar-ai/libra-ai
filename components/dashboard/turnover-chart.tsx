"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Info } from "lucide-react";
import { TurnoverDataPoint } from "@/services/dashboard-service";

interface TurnoverChartProps {
  data: TurnoverDataPoint[];
}

export function TurnoverChart({ data }: TurnoverChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasData = data && data.length > 0 && data.some((d) => d.borrowed > 0 || d.returned > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            Kitab Dövriyyəsi Dinamikası
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aylıq kitab verilməsi və qaytarılması göstəriciləri
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
            Verilən
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Qaytarılan
          </span>
        </div>
      </div>

      {/* Chart Body or Graceful Empty State */}
      <div className="h-64 sm:h-72 w-full flex items-center justify-center">
        {!isMounted ? (
          <div className="text-xs text-slate-400">Yüklənir...</div>
        ) : !hasData ? (
          <div className="text-center p-6 flex flex-col items-center justify-center h-full w-full rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
              <BarChart3 className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">
              Hələlik dövriyyə statistikası formalaşmayıb
            </h4>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Kitabxanaçılar tərəfindən kitab verilməsi və ya qaytarılması əməliyyatları icra edildikcə aylıq dinamika qrafikdə əks olunacaq.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-600 text-[11px] font-medium">
              <Info className="w-3 h-3 text-slate-500" />
              0 dövriyyə qeydi
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#1E293B",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                }}
                itemStyle={{ color: "#fff", padding: "2px 0" }}
                labelStyle={{ fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
              <Bar
                name="Verilən kitablar"
                dataKey="borrowed"
                fill="#4F46E5"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Qaytarılan kitablar"
                dataKey="returned"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

