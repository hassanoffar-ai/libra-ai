"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon, Info } from "lucide-react";
import { CategoryDistribution } from "@/services/dashboard-service";

interface CategoryChartProps {
  data: CategoryDistribution[];
}

const DEFAULT_COLORS = [
  "#4F46E5", // Indigo (Texniki)
  "#0EA5E9", // Sky (Dərslik)
  "#10B981", // Emerald (Bədii)
  "#F59E0B", // Amber (Elmi)
  "#8B5CF6", // Violet (Tarixi)
  "#64748B", // Slate (Digər)
];

export function CategoryChart({ data }: CategoryChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasData = data && data.length > 0 && data.some((item) => item.count > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Fondun Sahələr Üzrə Bölgüsü
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kitabların ixtisas və kateqoriyalara görə proporsiyası
          </p>
        </div>
      </div>

      {/* Donut Chart or Graceful Empty State */}
      <div className="h-64 sm:h-72 w-full flex items-center justify-center">
        {!isMounted ? (
          <div className="text-xs text-slate-400">Yüklənir...</div>
        ) : !hasData ? (
          <div className="text-center p-6 flex flex-col items-center justify-center h-full w-full rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
              <PieChartIcon className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">
              Hələlik dövriyyə statistikası formalaşmayıb
            </h4>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Fondun sahələr üzrə (Texniki, Bədii, Dərslik və s.) bölgüsü sistemə kitab nüsxələri daxil edildikcə burada əks olunacaq.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-600 text-[11px] font-medium">
              <Info className="w-3 h-3 text-slate-500" />
              Kateqoriya qeydiyyatı gözlənilir
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${value ?? 0} nüsxə`,
                  String(name),
                ]}
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#1E293B",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

