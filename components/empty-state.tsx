import React from "react";
import { Sparkles, ArrowRight, Clock } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  category?: string;
}

export function EmptyState({
  title,
  description = "Bu bölmə üzərində təkmilləşdirmə işləri aparılır. Tezliklə tam funksionallıqla istifadəyə veriləcəkdir.",
  category,
}: EmptyStateProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          {category && (
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1 inline-block">
              {category}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Hazırlıq mərhələsində</span>
        </div>
      </div>

      {/* Empty State Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-sm mb-5 transition-transform hover:scale-105 duration-200">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Bu bölmə tezliklə qurulacaq
        </h2>

        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
          {description}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Peşə Kitabxanası Modulu Aktivləşdirilməsi Gözlənilir
        </div>
      </div>
    </div>
  );
}

