"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Search,
  User,
  BookOpen,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
  Sparkles,
} from "lucide-react";
import {
  Reader,
  getReaders,
  issueBook,
  getLoans,
  Loan,
} from "@/services/circulation-service";
import {
  BookCopy,
  getCopies,
} from "@/services/books-service";

function VerilmeContent() {
  const searchParams = useSearchParams();
  const preselectedReaderId = searchParams.get("readerId");
  const preselectedCopyId = searchParams.get("copyId");

  // Data sources
  const [readers, setReaders] = useState<Reader[]>([]);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection states
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);

  // Search queries
  const [readerQuery, setReaderQuery] = useState("");
  const [copyQuery, setCopyQuery] = useState("");

  // Due date configuration
  const [duePeriodPreset, setDuePeriodPreset] = useState<number | "custom">(14);
  const [customDueDate, setCustomDueDate] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Submission & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rData, cData, lData] = await Promise.all([
        getReaders(),
        getCopies(),
        getLoans(),
      ]);
      setReaders(rData);
      setCopies(cData);
      setLoans(lData);

      // Handle preselected queries from URL if any
      if (preselectedReaderId) {
        const found = rData.find((r) => r.id === preselectedReaderId);
        if (found) setSelectedReader(found);
      }
      if (preselectedCopyId) {
        const found = cData.find((c) => c.id === preselectedCopyId);
        if (found) setSelectedCopy(found);
      }
    } catch (err) {
      console.error("Məlumatlar yüklənərkən xəta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Default custom date to 14 days from now
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setCustomDueDate(d.toISOString().split("T")[0]);
  }, []);

  // Calculate reader loan stats
  const readerActiveLoans = useMemo(() => {
    if (!selectedReader) return [];
    return loans.filter(
      (l) => l.readerId === selectedReader.id && (l.status === "Aktiv" || l.status === "Gecikib")
    );
  }, [selectedReader, loans]);

  const hasOverdueLoan = useMemo(() => {
    return readerActiveLoans.some((l) => l.status === "Gecikib");
  }, [readerActiveLoans]);

  const hasReachedLimit = useMemo(() => {
    if (!selectedReader) return false;
    return readerActiveLoans.length >= selectedReader.maxBookLimit;
  }, [selectedReader, readerActiveLoans]);

  // Reader search filter
  const searchResultsReaders = useMemo(() => {
    const q = readerQuery.toLowerCase().trim();
    if (!q) return [];
    return readers.filter((r) => {
      const fullName = `${r.firstName} ${r.lastName} ${r.fatherName || ""}`.toLowerCase();
      return (
        fullName.includes(q) ||
        r.ticketNumber.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }).slice(0, 5);
  }, [readers, readerQuery]);

  // Copy search filter
  const searchResultsCopies = useMemo(() => {
    const q = copyQuery.toLowerCase().trim();
    if (!q) return [];
    return copies.filter((c) => {
      return (
        c.inventoryNumber.toLowerCase().includes(q) ||
        c.bookTitle.toLowerCase().includes(q) ||
        c.shelfLocation.toLowerCase().includes(q)
      );
    }).slice(0, 5);
  }, [copies, copyQuery]);

  const handlePresetChange = (days: number) => {
    setDuePeriodPreset(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setCustomDueDate(d.toISOString().split("T")[0]);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReader || !selectedCopy) return;

    if (selectedCopy.status !== "Fondda") {
      setErrorMessage("Bu nüsxə hazırda fondda mövcud deyil (verilib və ya silinib).");
      return;
    }

    if (hasReachedLimit) {
      setErrorMessage("Oxucu icazə verilən maksimal kitab limitinə çatıb.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await issueBook({
        readerId: selectedReader.id,
        copyId: selectedCopy.id,
        customDueDate: customDueDate,
        notes: notes.trim(),
      });

      setSuccessMessage(
        `"${selectedCopy.bookTitle}" (${selectedCopy.inventoryNumber}) kitabı uğurla ${selectedReader.firstName} ${selectedReader.lastName} adlı oxucuya təhvil verildi!`
      );

      // Reset copy selection for next transaction
      setSelectedCopy(null);
      setCopyQuery("");
      setNotes("");

      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error("Kitab verilərkən xəta:", err);
      setErrorMessage(err.message || "Əməliyyat zamanı xəta baş verdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Kitab Verilməsi (İstiqraz)
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />
              Dövriyyə Qeydiyyatı
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Oxucuya və fiziki nüsxənin inventar nömrəsinə əsasən kitab təhvili
          </p>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Əməliyyat uğurla tamamlandı!</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Əməliyyat icra olunmadı</p>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Two-Column Circulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= LEFT COLUMN: OXUCU SEÇİMİ ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  1
                </span>
                Oxucu Seçimi
              </h2>
              {selectedReader && (
                <button
                  onClick={() => {
                    setSelectedReader(null);
                    setReaderQuery("");
                  }}
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  Seçimi dəyiş
                </button>
              )}
            </div>

            {!selectedReader ? (
              /* Reader Search & Results Dropdown */
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Oxucunun Adı/Soyadı ilə canlı axtarış:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={readerQuery}
                    onChange={(e) => setReaderQuery(e.target.value)}
                    placeholder="Məs: Rəşad Qasımov..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Live Search Results List */}
                {readerQuery && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm max-h-60 overflow-y-auto">
                    {searchResultsReaders.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Axtarışa uyğun oxucu tapılmadı.
                      </div>
                    ) : (
                      searchResultsReaders.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setSelectedReader(r);
                            setReaderQuery("");
                          }}
                          className="p-3 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">
                              {r.firstName} {r.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {r.department}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {r.category}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Oxucu qeydiyyatı yoxdursa, əvvəlcə <b>/oxucular</b> bölməsindən yeni oxucu əlavə edin.
                </p>
              </div>
            ) : (
              /* Selected Reader Card */
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3 animate-in fade-in text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                      {selectedReader.firstName.charAt(0)}{selectedReader.lastName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-800 block text-[11px]">
                        {selectedReader.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {selectedReader.firstName} {selectedReader.lastName}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${selectedReader.status === "Aktiv"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                  >
                    {selectedReader.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Kateqoriya / Qrup:</span>
                    <span className="font-semibold text-slate-800">{selectedReader.category} • {selectedReader.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Telefon:</span>
                    <span className="font-semibold text-slate-800">{selectedReader.phone}</span>
                  </div>
                </div>

                {/* Loan Status & Limits */}
                <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Aktiv götürülmüş kitablar:</span>
                  <span className="font-bold text-indigo-900 bg-white px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {readerActiveLoans.length} / {selectedReader.maxBookLimit} limit
                  </span>
                </div>

                {/* Warnings */}
                {hasOverdueLoan && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-[11px]">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Xəbərdarlıq: Bu oxucunun qaytarma müddəti ötən kitabı var!</span>
                  </div>
                )}

                {hasReachedLimit && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-2 text-[11px]">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Oxucu maksimal kitab limitinə çatıb. Yeni kitab verilə bilməz.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            Adım 1: Kitab götürəcək oxucunu təyin edin.
          </div>
        </div>

        {/* ================= RIGHT COLUMN: NÜSXƏ SEÇİMİ & TƏSDİQ ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  2
                </span>
                Nüsxə Seçimi və Qeydiyyat
              </h2>
              {selectedCopy && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCopy(null);
                    setCopyQuery("");
                  }}
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  Seçimi dəyiş
                </button>
              )}
            </div>

            {!selectedCopy ? (
              /* Copy Search & Results Dropdown */
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  İnventar nömrəsi və ya Kitab adı ilə axtarış:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={copyQuery}
                    onChange={(e) => setCopyQuery(e.target.value)}
                    placeholder="Məs: INV-1001..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  />
                </div>

                {/* Live Search Results List */}
                {copyQuery && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm max-h-60 overflow-y-auto">
                    {searchResultsCopies.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Axtarışa uyğun nüsxə tapılmadı.
                      </div>
                    ) : (
                      searchResultsCopies.map((c) => {
                        const isAvailable = c.status === "Fondda";
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCopy(c);
                              setCopyQuery("");
                            }}
                            className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs ${isAvailable ? "hover:bg-indigo-50/60" : "bg-slate-50/80 opacity-60 cursor-not-allowed"
                              }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900">{c.bookTitle}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <MapPin className="w-3 h-3 text-indigo-500" />
                                <span>{c.shelfLocation}</span>
                                <span>•</span>
                                <span>Vəziyyət: {c.condition}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 block">
                                {c.inventoryNumber}
                              </span>
                              <span className={`text-[10px] font-semibold mt-0.5 block ${isAvailable ? "text-emerald-600" : "text-rose-600"}`}>
                                {c.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Copy Card */
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[11px]">
                      {selectedCopy.inventoryNumber}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {selectedCopy.bookTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500">{selectedCopy.bookAuthor}</p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${selectedCopy.status === "Fondda"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                  >
                    {selectedCopy.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{selectedCopy.shelfLocation}</span>
                  </div>
                  <div className="text-right text-slate-600">
                    Fiziki vəziyyəti: <strong className="text-slate-800">{selectedCopy.condition}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Qaytarılma Müddəti Seçimi */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <label className="block font-semibold text-slate-700">
                Qaytarılma Müddəti:
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetChange(14)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${duePeriodPreset === 14
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  14 gün (Standart)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange(30)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${duePeriodPreset === 30
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  30 gün (1 ay)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange(90)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${duePeriodPreset === 90
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  Semestr sonu
                </button>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] text-slate-500 mb-1">
                  Son qaytarılma tarixi:
                </label>
                <input
                  type="date"
                  required
                  value={customDueDate}
                  onChange={(e) => {
                    setCustomDueDate(e.target.value);
                    setDuePeriodPreset("custom");
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Xüsusi qeyd (İstəyə görə):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Məs: Kurs işi üçün verilib..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={
                  !selectedReader ||
                  !selectedCopy ||
                  selectedCopy.status !== "Fondda" ||
                  hasReachedLimit ||
                  isSubmitting
                }
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isSubmitting ? "Təsdiqlənir..." : "Verilməni Təsdiq Et"}</span>
              </button>
            </div>
          </form>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            Adım 2: Fiziki nüsxəni seçin və müddəti təsdiq edin.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerilmePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Yüklənir...</p>
          </div>
        </div>
      }
    >
      <VerilmeContent />
    </Suspense>
  );
}
