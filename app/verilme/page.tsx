"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
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
  AlertCircle,
  GraduationCap,
  Briefcase,
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
  updateReader,
  isReaderPending,
  isReaderActive,
} from "@/services/circulation-service";
import {
  BookCopy,
  getCopies,
} from "@/services/books-service";

type DurationMode = "days" | "months" | "academic_year" | "custom";

function getAcademicYearTargetYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed: 0 = Jan, 5 = June, 6 = July
  return currentMonth >= 6 ? currentYear + 1 : currentYear;
}

function getEndOfAcademicYearDate(): string {
  return `${getAcademicYearTargetYear()}-06-30`;
}

function formatDueDatePreview(dateStr: string): string {
  if (!dateStr) return "Tarix seçilməyib";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`; // GG.AA.İİİİ

  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${formattedDate} (Vaxtı keçib)`;
  if (diffDays === 0) return `${formattedDate} (Bu gün qaytarılmalıdır)`;
  if (diffDays === 1) return `${formattedDate} (Sabah, 1 gün qaldı)`;
  if (diffDays < 30) return `${formattedDate} (${diffDays} gün qaldı)`;

  const months = Math.floor(diffDays / 30);
  const remDays = diffDays % 30;
  if (remDays === 0) return `${formattedDate} (${months} ay qaldı)`;
  return `${formattedDate} (${months} ay ${remDays} gün qaldı)`;
}

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

  // Reader Academic / Staff details (Requirements 1 & 2)
  const [readerType, setReaderType] = useState<"Tələbə" | "Müəllim">("Tələbə");
  const [specialty, setSpecialty] = useState<string>("");
  const [courseYear, setCourseYear] = useState<string>("1-ci kurs");
  const [position, setPosition] = useState<string>("");

  // Pre-fill when selectedReader changes
  useEffect(() => {
    if (selectedReader) {
      const type: "Tələbə" | "Müəllim" =
        selectedReader.category === "Müəllim" ? "Müəllim" : "Tələbə";
      setReaderType(type);
      setSpecialty(
        selectedReader.specialty ||
          (type === "Tələbə" && selectedReader.department && selectedReader.department !== "Tələbə qrupu"
            ? selectedReader.department
            : "")
      );
      setCourseYear(selectedReader.courseYear || "1-ci kurs");
      setPosition(
        selectedReader.position ||
          (type === "Müəllim" && selectedReader.department && selectedReader.department !== "Pedaqoji heyət"
            ? selectedReader.department
            : "")
      );
    } else {
      setSpecialty("");
      setPosition("");
    }
  }, [selectedReader]);

  // Search queries
  const [readerQuery, setReaderQuery] = useState("");
  const [copyQuery, setCopyQuery] = useState("");

  // Flexible Loan Duration configuration (Requirement 2)
  const [durationMode, setDurationMode] = useState<DurationMode>("days");
  const [durationDays, setDurationDays] = useState<number>(14);
  const [durationMonths, setDurationMonths] = useState<number>(1);
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

  const activeLoansList = useMemo(() => {
    return loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib");
  }, [loans]);

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

  const handleDaysChange = (days: number) => {
    const cleanDays = Math.max(1, days || 1);
    setDurationDays(cleanDays);
    const d = new Date();
    d.setDate(d.getDate() + cleanDays);
    setCustomDueDate(d.toISOString().split("T")[0]);
  };

  const handleMonthsChange = (months: number) => {
    const cleanMonths = Math.max(1, months || 1);
    setDurationMonths(cleanMonths);
    const d = new Date();
    d.setMonth(d.getMonth() + cleanMonths);
    setCustomDueDate(d.toISOString().split("T")[0]);
  };

  const handleModeChange = (mode: DurationMode) => {
    setDurationMode(mode);
    if (mode === "days") {
      handleDaysChange(durationDays);
    } else if (mode === "months") {
      handleMonthsChange(durationMonths);
    } else if (mode === "academic_year") {
      setCustomDueDate(getEndOfAcademicYearDate());
    }
  };

  const handleApproveSelectedReader = async () => {
    if (!selectedReader) return;
    try {
      await updateReader(selectedReader.id, { status: "active" });
      setSelectedReader({ ...selectedReader, status: "active" });
      setReaders((prev) =>
        prev.map((r) => (r.id === selectedReader.id ? { ...r, status: "active" } : r))
      );
      setSuccessMessage(
        `"${selectedReader.firstName} ${selectedReader.lastName}" adlı oxucu uğurla təsdiqləndi və aktiv edildi!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Oxucu təsdiqlənərkən xəta:", err);
      setErrorMessage(err?.message || "Oxucunu təsdiqləyərkən xəta baş verdi.");
    }
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

    // Validate academic / staff details (Requirements 1 & 2)
    if (readerType === "Tələbə") {
      if (!specialty.trim()) {
        setErrorMessage("Zəhmət olmasa tələbənin İxtisas sahəsini daxil edin.");
        return;
      }
      if (!courseYear.trim()) {
        setErrorMessage("Zəhmət olmasa tələbənin Kurs məlumatını seçin.");
        return;
      }
    } else {
      if (!position.trim()) {
        setErrorMessage("Zəhmət olmasa müəllimin Vəzifə / Fənn sahəsini daxil edin.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await issueBook({
        readerId: selectedReader.id,
        copyId: selectedCopy.id,
        customDueDate: customDueDate,
        notes: notes.trim(),
        readerType,
        specialty: readerType === "Tələbə" ? specialty.trim() : undefined,
        courseYear: readerType === "Tələbə" ? courseYear.trim() : undefined,
        position: readerType === "Müəllim" ? position.trim() : undefined,
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
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isReaderPending(selectedReader.status)
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : isReaderActive(selectedReader.status)
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {isReaderPending(selectedReader.status)
                      ? "Təsdiq gözləyir"
                      : isReaderActive(selectedReader.status)
                      ? "Aktiv"
                      : selectedReader.status}
                  </span>
                </div>

                {/* Inline approval prompt if reader status is pending - Requirement 4 */}
                {isReaderPending(selectedReader.status) && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="font-semibold text-[11px] sm:text-xs">
                        Bu oxucu hələ təsdiqlənməyib. Təsdiqləyib kitab verilsin?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApproveSelectedReader}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Təsdiqlə və Davam et</span>
                    </button>
                  </div>
                )}

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

                {/* Editable Oxucu Məlumatları (Reader Details) - Requirements 1 & 2 */}
                <div className="pt-3 border-t border-indigo-200/70 space-y-3 bg-white/90 p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>Oxucu Məlumatları (Tədris / Vəzifə)</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      Yadda saxlanılır
                    </span>
                  </div>

                  {/* Oxucu Statusu / Növü Segmented Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Oxucu Statusu / Növü <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReaderType("Tələbə")}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          readerType === "Tələbə"
                            ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Tələbə</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReaderType("Müəllim")}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          readerType === "Müəllim"
                            ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Müəllim</span>
                      </button>
                    </div>
                  </div>

                  {/* Conditional inputs based on selection */}
                  {readerType === "Tələbə" ? (
                    <div className="space-y-2.5 animate-in fade-in duration-200">
                      {/* İxtisas text input */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          İxtisas <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Məs: Kompüter sistemlərində proqramlaşdırma"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                        />
                      </div>

                      {/* Kurs selector */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Kurs <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={courseYear}
                          onChange={(e) => setCourseYear(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                        >
                          <option value="1-ci kurs">1-ci kurs</option>
                          <option value="2-ci kurs">2-ci kurs</option>
                          <option value="3-cü kurs">3-cü kurs</option>
                          <option value="4-cü kurs">4-cü kurs</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 animate-in fade-in duration-200">
                      {/* Vəzifə / Fənn keyboard input */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Vəzifə / Fənn <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Məs: İxtisas fənn müəllimi və ya Direktor müavini"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                        />
                      </div>
                    </div>
                  )}
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

            {/* ================= VERİLMƏ MÜDDƏTİ (FLEXIBLE LOAN DURATION) - Requirement 2 ================= */}
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Verilmə Müddəti</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Kitabxanaçı tərəfindən tənzimlənən
                </span>
              </div>

              {/* Mode Selector Tabs (4 options) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => handleModeChange("days")}
                  className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all ${
                    durationMode === "days"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Gün sayı ilə
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("months")}
                  className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all ${
                    durationMode === "months"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ay sayı ilə
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("academic_year")}
                  className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all ${
                    durationMode === "academic_year"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tədris ili sonu
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("custom")}
                  className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all ${
                    durationMode === "custom"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Konkret tarix
                </button>
              </div>

              {/* Dynamic Mode Controls */}
              {durationMode === "days" && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                        Gün sayı daxil edin:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={durationDays}
                        onChange={(e) => handleDaysChange(Number(e.target.value))}
                        className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-800 text-center"
                      />
                      <span className="text-slate-500 font-medium text-[11px]">gün</span>
                    </div>

                    {/* Quick day presets */}
                    <div className="flex items-center gap-1">
                      {[7, 14, 20, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleDaysChange(d)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            durationDays === d
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {d} gün
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {durationMode === "months" && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                        Ay sayı daxil edin:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={durationMonths}
                        onChange={(e) => handleMonthsChange(Number(e.target.value))}
                        className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-800 text-center"
                      />
                      <span className="text-slate-500 font-medium text-[11px]">ay</span>
                    </div>

                    {/* Quick month presets */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 6].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMonthsChange(m)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            durationMonths === m
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {m} ay
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {durationMode === "academic_year" && (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-950 block text-[11px]">
                        Tədris ilinin yekun tarixi: 30 İyun {getAcademicYearTargetYear()}
                      </span>
                      <span className="text-[10px] text-amber-700">
                        Bütün tədris ili boyunca dərsliklərin verilməsi üçün nəzərdə tutulub
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-900 bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-2xs">
                      30.06.{getAcademicYearTargetYear()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                    <label className="text-[10px] font-medium text-amber-900 whitespace-nowrap">
                      Tarixi dəyişmək istəsəniz:
                    </label>
                    <input
                      type="date"
                      value={customDueDate}
                      onChange={(e) => setCustomDueDate(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono text-slate-800"
                    />
                  </div>
                </div>
              )}

              {durationMode === "custom" && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Konkret son qaytarılma tarixini seçin:
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={customDueDate}
                    onChange={(e) => setCustomDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-slate-800"
                  />
                </div>
              )}

              {/* Live Preview Badge - Requirement 2 */}
              <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">
                      Təyin olunmuş qaytarılma
                    </span>
                    <span className="font-bold text-indigo-950 text-xs truncate block">
                      Qaytarılma tarixi: {formatDueDatePreview(customDueDate)}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shadow-2xs whitespace-nowrap">
                  {customDueDate}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Xüsusi qeyd (İstəyə görə):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Məs: Kurs işi və ya tədris semestri üçün verilib..."
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

      {/* ================= ACTIVE CIRCULATIONS (AKTİV DÖVRİYYƏ) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Aktiv Dövriyyə (Hal-hazırda Oxucularda Olan Kitablar)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fonddan oxuculara verilmiş aktiv nüsxələr və qeydə alınmış təhsil/vəzifə məlumatları
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              {activeLoansList.length} aktiv nüsxə
            </span>
            <Link
              href="/qaytarilma"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              <span>Qaytarılma Paneli</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {activeLoansList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Hal-hazırda fonddan heç bir aktiv verilmiş kitab yoxdur.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-2.5 px-3">İnventar / Kitab</th>
                  <th className="py-2.5 px-3">Oxucu və Status (Tədris/Vəzifə)</th>
                  <th className="py-2.5 px-3">Verilmə Tarixi</th>
                  <th className="py-2.5 px-3">Son Qaytarma</th>
                  <th className="py-2.5 px-3 text-center">Vəziyyət</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeLoansList.map((loan) => {
                  const today = new Date().toISOString().split("T")[0];
                  const isOverdue = loan.dueDate < today;
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-bold text-indigo-700 block">
                          {loan.inventoryNumber}
                        </span>
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                          {loan.bookTitle}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                          {loan.bookAuthor}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {loan.readerName}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium truncate max-w-[240px]">
                          {loan.readerTypeSnapshot || (
                            loan.readerCategory === "Müəllim" || (loan as any).readerRole === "teacher"
                              ? `Müəllim${loan.position ? ` • ${loan.position}` : ""}`
                              : `Tələbə${loan.specialty ? ` • ${loan.specialty}` : ""}${loan.courseYear ? ` (${loan.courseYear})` : ""}`
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {loan.issueDate}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <span className={isOverdue ? "text-rose-600 font-bold" : "text-slate-700"}>
                          {loan.dueDate}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Gecikir
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            Vaxtındadır
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
