"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  Search,
  BookOpen,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
} from "lucide-react";
import {
  Loan,
  getLoans,
  returnBook,
} from "@/services/circulation-service";

export default function QaytarilmaPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);

  // Return Action Modal state
  const [returningLoan, setReturningLoan] = useState<Loan | null>(null);
  const [returnCondition, setReturnCondition] = useState<"Əla" | "Yaxşı" | "Təmirə ehtiyac var" | "Yararsız">("Əla");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const data = await getLoans();
      setLoans(data);
    } catch (err) {
      console.error("İstiqrazlar yüklənərkən xəta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();

    const handleUpdate = () => fetchLoans();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Filter only active loans (not yet returned)
  const activeLoans = useMemo(() => {
    return loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib");
  }, [loans]);

  // Filtered list
  const filteredLoans = useMemo(() => {
    return activeLoans.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.inventoryNumber.toLowerCase().includes(q) ||
        l.readerTicket.toLowerCase().includes(q) ||
        l.readerName.toLowerCase().includes(q) ||
        l.bookTitle.toLowerCase().includes(q);

      const isOverdue = l.dueDate < today;
      const matchesOverdue = !filterOverdueOnly || isOverdue;

      return matchesSearch && matchesOverdue;
    });
  }, [activeLoans, searchQuery, filterOverdueOnly, today]);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningLoan) return;

    setIsSubmitting(true);
    try {
      await returnBook({
        loanId: returningLoan.id,
        conditionAtReturn: returnCondition,
        notes: returnNotes.trim(),
      });

      setSuccessMessage(
        `"${returningLoan.bookTitle}" (${returningLoan.inventoryNumber}) kitabı uğurla kitabxana fonduna qəbul edildi.`
      );
      setReturningLoan(null);
      setReturnNotes("");
      await fetchLoans();
    } catch (err: any) {
      console.error("Kitab qaytarılarkən xəta:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E4E0F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Kitab Qaytarılması
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200/60 text-violet-800 text-xs font-bold">
              <ArrowDownLeft className="w-3.5 h-3.5 text-violet-700" />
              Fond Qəbulu
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Oxucularda olan kitabların təhvil alınması, vəziyyətinin qiymətləndirilməsi və fonda qaytarılması
          </p>
        </div>

        <Link
          href="/verilme"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#E4E0F0] hover:bg-[#F7F5FC] text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-violet-700" />
          <span>Kitab Verilməsi Bölməsi</span>
        </Link>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Kitab qəbul edildi!</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Search & Overdue Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E4E0F0] p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Main search bar */}
          <div className="sm:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Axtarış: İnventar №, Oxucu bileti, Oxucu adı və ya Kitab..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all"
            />
          </div>

          {/* Overdue checkbox toggle */}
          <div className="sm:col-span-4 flex items-center sm:justify-end">
            <label className="relative flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterOverdueOnly}
                onChange={(e) => setFilterOverdueOnly(e.target.checked)}
                className="w-4 h-4 text-violet-700 rounded border-[#E4E0F0] focus:ring-violet-500"
              />
              <span className="text-xs font-bold text-slate-700">
                Yalnız gecikdirilən qaytarmalar
              </span>
            </label>
          </div>
        </div>

        {/* Toolbar status text */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Aktiv istiqrazlar: <strong className="text-slate-800">{filteredLoans.length}</strong> / {activeLoans.length}
          </span>
          {(searchQuery || filterOverdueOnly) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterOverdueOnly(false);
              }}
              className="text-violet-700 hover:underline font-semibold"
            >
              Axtarışı sıfırla
            </button>
          )}
        </div>
      </div>

      {/* 3. Loans Table or Graceful Real Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-12 text-center text-slate-400 text-sm">
          Aktiv istiqrazlar yüklənir...
        </div>
      ) : activeLoans.length === 0 ? (
        /* Empty State: 100% Real Empty state */
        <div className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xs">
          <div className="w-16 h-16 rounded-xl bg-violet-50 border border-violet-200/70 flex items-center justify-center text-violet-700 shadow-sm mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Hazırda bazada qeydiyyata alınmış məlumat yoxdur
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Bütün nüsxələr vaxtında kitabxana fonduna təhvil verilib və ya hazırda aktiv istiqraz qeydə alınmayıb.
          </p>
          <Link
            href="/verilme"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Kitab verilməsi bölməsinə keç</span>
          </Link>
        </div>
      ) : filteredLoans.length === 0 ? (
        /* Empty State: Search produced 0 results */
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            Axtarışa uyğun aktiv istiqraz tapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Daxil edilmiş inventar nömrəsini və ya oxucu adını yenidən yoxlayın.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterOverdueOnly(false);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors cursor-pointer"
          >
            Axtarışı təmizlə
          </button>
        </div>
      ) : (
        /* Active Loans Table */
        <div className="bg-white rounded-xl border border-[#E4E0F0] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F5FC] border-b border-[#E4E0F0] text-[11px] font-bold text-violet-950 uppercase tracking-wider">
                  <th className="py-3 px-4">İnventar №</th>
                  <th className="py-3 px-4">Kitabın Adı</th>
                  <th className="py-3 px-4">Oxucu</th>
                  <th className="py-3 px-4">Verilmə Tarixi</th>
                  <th className="py-3 px-4">Son Qaytarılma Tarixi</th>
                  <th className="py-3 px-4 text-center">Gecikmə Statusu</th>
                  <th className="py-3 px-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0F0]">
                {filteredLoans.map((loan) => {
                  const isOverdue = loan.dueDate < today;
                  const diffDays = isOverdue
                    ? Math.round(
                        (new Date(today).getTime() - new Date(loan.dueDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 0;

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-[#F7F5FC] transition-colors group"
                    >
                      {/* Inventory number */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-violet-900 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200/70 text-xs">
                          {loan.inventoryNumber}
                        </span>
                      </td>

                      {/* Book Title */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 max-w-xs truncate">
                          {loan.bookTitle}
                        </div>
                      </td>

                      {/* Reader */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{loan.readerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {loan.readerTicket}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Issue date */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {loan.issueDate}
                      </td>

                      {/* Due date */}
                      <td className="py-3 px-4 font-mono text-slate-800 font-medium">
                        {loan.dueDate}
                      </td>

                      {/* Overdue badge */}
                      <td className="py-3 px-4 text-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{diffDays} gün gecikir</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            <span>Vaxtındadır</span>
                          </span>
                        )}
                      </td>

                      {/* Return Action Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setReturningLoan(loan);
                            setReturnCondition("Əla");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 active:bg-violet-900 shadow-sm transition-all cursor-pointer"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Qaytar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#2E1065]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setReturningLoan(null)}
          />

          <div className="relative w-full max-w-md bg-white rounded-xl border border-[#E4E0F0] shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0F0] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 border border-violet-200/70 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kitabın Qəbulu</h3>
                  <p className="text-xs text-slate-500 font-mono">{returningLoan.inventoryNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setReturningLoan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-[#F7F5FC] border border-[#E4E0F0] space-y-1">
                <span className="text-slate-400 block font-medium text-[11px]">Qaytarılan Nəşr:</span>
                <span className="font-bold text-slate-900 block truncate text-xs">{returningLoan.bookTitle}</span>
                <span className="text-slate-500 block text-[11px]">Oxucu: {returningLoan.readerName}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fiziki Vəziyyəti Təsdiqləyin:
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all font-semibold text-slate-800"
                >
                  <option value="Əla">Əla (Zədəsiz)</option>
                  <option value="Yaxşı">Yaxşı (Təbii köhnəlmə)</option>
                  <option value="Təmirə ehtiyac var">Təmirə ehtiyac var (Cırılıb/Ləkələnib)</option>
                  <option value="Yararsız">Yararsız (Fonddan silinməli)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Qeyd (İstəyə görə):
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-3 border-t border-[#E4E0F0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReturningLoan(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 active:bg-violet-900 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "İcra olunur..." : "Fonda Qaytar"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
