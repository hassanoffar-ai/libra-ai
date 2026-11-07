"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  Loan,
  Reader,
  getLoans,
  getReaders,
} from "@/services/circulation-service";
import {
  Book,
  getBooks,
  getCopies,
  BookCopy,
} from "@/services/books-service";

type PeriodPreset = "today" | "week" | "month" | "semester" | "custom";

export default function HesabatlarPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time Period Filter
  const [period, setPeriod] = useState<PeriodPreset>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lData, rData, bData, cData] = await Promise.all([
        getLoans(),
        getReaders(),
        getBooks(),
        getCopies(),
      ]);
      setLoans(lData);
      setReaders(rData);
      setBooks(bData);
      setCopies(cData);
    } catch (err) {
      console.error("Hesabat məlumatları yüklənərkən xəta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Default dates
    const today = new Date();
    const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDayMonth.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);

    const handleUpdate = () => fetchData();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate Date Bounds based on Preset
  const { filterStart, filterEnd } = useMemo(() => {
    const now = new Date();
    let s = new Date();
    const e = new Date();

    if (period === "today") {
      s = now;
    } else if (period === "week") {
      s.setDate(now.getDate() - 7);
    } else if (period === "month") {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "semester") {
      s.setMonth(now.getMonth() - 5);
    } else if (period === "custom") {
      return {
        filterStart: startDate || "2000-01-01",
        filterEnd: endDate || todayStr,
      };
    }

    return {
      filterStart: s.toISOString().split("T")[0],
      filterEnd: e.toISOString().split("T")[0],
    };
  }, [period, startDate, endDate, todayStr]);

  // Loans within period
  const loansInPeriod = useMemo(() => {
    return loans.filter((l) => {
      const isIssuedInPeriod = l.issueDate >= filterStart && l.issueDate <= filterEnd;
      const isReturnedInPeriod = l.returnDate && l.returnDate >= filterStart && l.returnDate <= filterEnd;
      return isIssuedInPeriod || isReturnedInPeriod;
    });
  }, [loans, filterStart, filterEnd]);

  const issuedCount = useMemo(() => {
    return loans.filter((l) => l.issueDate >= filterStart && l.issueDate <= filterEnd).length;
  }, [loans, filterStart, filterEnd]);

  const returnedCount = useMemo(() => {
    return loans.filter((l) => l.returnDate && l.returnDate >= filterStart && l.returnDate <= filterEnd).length;
  }, [loans, filterStart, filterEnd]);

  const activeLoans = useMemo(() => {
    return loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib");
  }, [loans]);

  // Overdue Loans & Delinquent Readers List
  const overdueLoansList = useMemo(() => {
    return activeLoans.filter((l) => l.dueDate < todayStr).map((l) => {
      const reader = readers.find((r) => r.id === l.readerId);
      const dueTime = new Date(l.dueDate).getTime();
      const nowTime = new Date(todayStr).getTime();
      const diffDays = Math.max(1, Math.round((nowTime - dueTime) / (1000 * 60 * 60 * 24)));

      return {
        ...l,
        readerPhone: reader?.phone || "—",
        readerDept: reader?.department || "—",
        daysOverdue: diffDays,
      };
    });
  }, [activeLoans, readers, todayStr]);

  // Top Active Readers Ranking
  const topReaders = useMemo(() => {
    const countMap: Record<string, { readerName: string; ticket: string; dept: string; count: number }> = {};
    loans.forEach((l) => {
      if (!countMap[l.readerId]) {
        const reader = readers.find((r) => r.id === l.readerId);
        countMap[l.readerId] = {
          readerName: l.readerName,
          ticket: l.readerTicket,
          dept: reader?.department || "—",
          count: 0,
        };
      }
      countMap[l.readerId].count += 1;
    });

    return Object.values(countMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [loans, readers]);

  // Top Most Borrowed Books Ranking
  const topBooks = useMemo(() => {
    const countMap: Record<string, { title: string; author: string; category: string; count: number }> = {};
    loans.forEach((l) => {
      if (!countMap[l.bookId]) {
        const book = books.find((b) => b.id === l.bookId);
        countMap[l.bookId] = {
          title: l.bookTitle,
          author: l.bookAuthor,
          category: book?.category || "Tədris",
          count: 0,
        };
      }
      countMap[l.bookId].count += 1;
    });

    return Object.values(countMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [loans, books]);

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (loans.length === 0) {
      alert("İxrac ediləcək dövriyyə məlumatı tapılmadı.");
      return;
    }

    const headers = [
      "İnventar №",
      "Kitabın Adı",
      "Müəllif",
      "Oxucu Bilet №",
      "Oxucu Adı",
      "Verilmə Tarixi",
      "Son Qaytarılma Tarixi",
      "Faktiki Qaytarılma",
      "Status",
    ];

    const rows = loans.map((l) => [
      `"${l.inventoryNumber}"`,
      `"${l.bookTitle.replace(/"/g, '""')}"`,
      `"${l.bookAuthor.replace(/"/g, '""')}"`,
      `"${l.readerTicket}"`,
      `"${l.readerName.replace(/"/g, '""')}"`,
      `"${l.issueDate}"`,
      `"${l.dueDate}"`,
      `"${l.returnDate || "Qaytarılmayıb"}"`,
      `"${l.status}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LIBRA_AI_Hesabat_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print Form
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-4">
      {/* 1. Header (Screen & Print Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Hesabatlar və Statistika
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold print:hidden">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              Rəsmi İcmal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lənkəran Dövlət Peşə Təhsil Mərkəzinin kitabxana fondu və dövriyyə göstəriciləri
          </p>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
            title="Excel formatında (.csv) endir"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel-ə İxrac Et</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-all"
            title="Çap üçün sənəd hazırla"
          >
            <Printer className="w-4 h-4" />
            <span>Çap üçün Forma Hazırla</span>
          </button>
        </div>
      </div>

      {/* Official Print Header (Only visible when printing) */}
      <div className="hidden print:block text-center pb-4 border-b border-slate-300">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
          Lənkəran Dövlət Peşə Təhsil Mərkəzi
        </h2>
        <h3 className="text-lg font-extrabold text-slate-950 mt-1">
          Kitabxana Dövriyyəsi və Fond Hesabatı
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Dövr: {filterStart} — {filterEnd} | Tərtib tarixi: {todayStr}
        </p>
      </div>

      {/* 2. Filtrlər Paneli (Dövr Seçimi) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Hesabat Dövrü:
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setPeriod("today")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "today"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bu gün
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "week"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bu həftə
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "month"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bu ay
            </button>
            <button
              onClick={() => setPeriod("semester")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "semester"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Cari semestr
            </button>
            <button
              onClick={() => setPeriod("custom")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "custom"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Fərdi aralıq
            </button>
          </div>
        </div>

        {/* Custom date range pickers */}
        {period === "custom" && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Başlanğıc:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Bitmə:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Əsas Hesabat Blokları (KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verilən Kitablar</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{issuedCount}</span>
          <p className="text-[11px] text-slate-400 mt-1">Dövr ərzində verilmiş</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Qaytarılan Kitablar</span>
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{returnedCount}</span>
          <p className="text-[11px] text-slate-400 mt-1">Dövr ərzində qəbul edilən</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Aktiv Oxucularda</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeLoans.length}</span>
          <p className="text-[11px] text-slate-400 mt-1">Hazırda istiqrazda olan</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Gecikən Nüsxələr</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">{overdueLoansList.length}</span>
          <p className="text-[11px] text-rose-500 mt-1">Müddəti ötən istiqrazlar</p>
        </div>
      </div>

      {/* 4. Gecikdirilən Nüsxələr və Borclu Oxucuların İcmal Cədvəli */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Gecikdirilən Nüsxələr və Borclu Oxucular
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Qaytarılma müddəti bitmiş və təhvil verilməmiş kitabların operativ siyahısı
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {overdueLoansList.length} borclu qeyd
          </span>
        </div>

        {overdueLoansList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-700">Müddəti ötən heç bir kitab qeydə alınmayıb!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bütün istiqrazlar vaxtındadır.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Bilet №</th>
                  <th className="py-2.5 px-3">Oxucu</th>
                  <th className="py-2.5 px-3">Şöbə / Qrup</th>
                  <th className="py-2.5 px-3">Əlaqə</th>
                  <th className="py-2.5 px-3">Kitab və İnventar</th>
                  <th className="py-2.5 px-3">Son Tarix</th>
                  <th className="py-2.5 px-3 text-right">Gecikmə</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueLoansList.map((item) => (
                  <tr key={item.id} className="hover:bg-rose-50/20">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {item.readerTicket}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {item.readerName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]">
                      {item.readerDept}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.readerPhone}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900 truncate max-w-[200px]">{item.bookTitle}</div>
                      <span className="font-mono text-[10px] text-indigo-700">{item.inventoryNumber}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-rose-600 font-semibold">
                      {item.dueDate}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {item.daysOverdue} gün
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Reytinqlər: Ən Fəal Oxucular & Ən Çox Oxunan Kitablar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol: Ən Fəal Oxucular */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Ən Fəal Oxucular
            </h2>
            <span className="text-xs text-slate-400">Top 5</span>
          </div>

          {topReaders.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Hələ heç bir oxu statistikası formalaşmayıb.
            </div>
          ) : (
            <div className="space-y-3">
              {topReaders.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{r.readerName}</h4>
                      <p className="text-[10px] text-slate-400">{r.ticket} • {r.dept}</p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                    {r.count} kitab
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: Ən Çox Müraciət Olunan İxtisas Dərslikləri */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Ən Çox Müraciət Olunan Nəşrlər
            </h2>
            <span className="text-xs text-slate-400">Top 5</span>
          </div>

          {topBooks.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Hələ heç bir kitab istiqrazı formalaşmayıb.
            </div>
          ) : (
            <div className="space-y-3">
              {topBooks.map((b, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{b.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{b.author} • {b.category}</p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 flex-shrink-0">
                    {b.count} dəfə
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Official Signature Lines for Print Format */}
      <div className="hidden print:flex items-center justify-between pt-16 px-8 text-xs text-slate-800">
        <div>
          <p className="font-semibold">Kitabxana Müdiri: _______________________</p>
          <p className="text-[10px] text-slate-500 mt-1">(İmza və Möhür yeri)</p>
        </div>
        <div>
          <p className="font-semibold">Tədris İşləri üzrə Direktor Müavini: _______________________</p>
          <p className="text-[10px] text-slate-500 mt-1">(Təsdiq tarixi: ___ / ___ / 2026)</p>
        </div>
      </div>
    </div>
  );
}
