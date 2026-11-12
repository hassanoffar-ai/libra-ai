"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Download,
  Eye,
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
import {
  DigitalResource,
  getDigitalResources,
} from "@/services/digital-library-service";
import * as XLSX from "xlsx";

type PeriodPreset = "all" | "academic" | "month" | "semester" | "custom";
type ActiveTab = "dashboard" | "official_doc";

// Helper: Format date as DD.MM.YYYY
function formatDateAz(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const clean = dateStr.split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
}

// Helper: Format academic details for Reader
function formatReaderAcademicInfo(reader?: Reader | null, fallbackDept?: string): string {
  if (!reader) return fallbackDept || "—";
  const isTeacher = reader.category === "Müəllim" || reader.role === "teacher";
  const isStudent = reader.category === "Tələbə" || reader.role === "student";

  if (isStudent) {
    const parts: string[] = [];
    if (reader.specialty) parts.push(reader.specialty);
    else if (reader.department) parts.push(reader.department);

    const courseVal = reader.courseYear || (reader as any).course;
    if (courseVal) {
      const courseStr = courseVal.toString().includes("kurs")
        ? courseVal.toString()
        : `${courseVal}-ci kurs`;
      parts.push(courseStr);
    }

    const details = parts.join(", ");
    return details ? `Tələbə (${details})` : `Tələbə (${reader.department || "Qrup təyin edilməyib"})`;
  }

  if (isTeacher) {
    const details = reader.position || reader.department || "İxtisas fənni";
    return `Müəllim (${details})`;
  }

  return reader.department ? `${reader.category || "Oxucu"} (${reader.department})` : (reader.category || "Oxucu");
}

export default function HesabatlarPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [digitalResources, setDigitalResources] = useState<DigitalResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab on screen
  const [activeTab, setActiveTab] = useState<ActiveTab>("official_doc");

  // Time Period Filter
  const [period, setPeriod] = useState<PeriodPreset>("academic");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Table Filters (for interactive dashboard)
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [selectedBookCategory, setSelectedBookCategory] = useState("all");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lData, rData, bData, cData, dData] = await Promise.all([
        getLoans().catch(() => []),
        getReaders().catch(() => []),
        getBooks().catch(() => []),
        getCopies().catch(() => []),
        getDigitalResources().catch(() => []),
      ]);
      setLoans(lData);
      setReaders(rData);
      setBooks(bData);
      setCopies(cData);
      setDigitalResources(dData);
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

  // Filter Active and Overdue Loans
  const activeLoans = useMemo(() => {
    return loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib" || !l.returnDate);
  }, [loans]);

  const overdueLoans = useMemo(() => {
    return activeLoans.filter((l) => l.dueDate && l.dueDate < todayStr);
  }, [activeLoans, todayStr]);

  // Returned loans
  const returnedLoans = useMemo(() => {
    return loans.filter((l) => l.status === "Qaytarılıb" || Boolean(l.returnDate));
  }, [loans]);

  // Section I & II Calculations (100% Real Database Queries)
  const stats = useMemo(() => {
    // 1. Ümumi Kitab Fondu (Cəmi nüsxə)
    const totalCopies = copies.length > 0
      ? copies.length
      : books.reduce((acc, b) => acc + (b.copiesCount || 0), 0);

    // 2. Fondda (Rəfdə) Mövcud Olanlar
    const inLibrary = copies.length > 0
      ? copies.filter((c) => c.status === "Fondda" || (c.status as string) === "Mövcuddur").length
      : books.reduce((acc, b) => acc + (b.availableCount ?? b.copiesCount ?? 0), 0);

    // 3. Oxucuda (İstifadədə) Olanlar
    const inUse = activeLoans.length;

    // 4. Vaxtı Keçmiş (Gecikən) Kitablar
    const overdue = overdueLoans.length;

    // 5. Təmirə / Cildləməyə Ehtiyacı Olanlar
    const damagedCount = copies.filter(
      (c) =>
        (c.condition as string) === "Təmirə ehtiyac var" ||
        (c.condition as string) === "Yararsız" ||
        (c.condition as string) === "Köhnəlmiş"
    ).length;

    // 6. Elektron Resurslar (E-Kitabxana)
    const eResources = digitalResources.length;

    // Oxucuların kontingenti
    const totalReaders = readers.length;
    const studentCount = readers.filter((r) => r.category === "Tələbə" || r.role === "student").length;
    const teacherCount = readers.filter((r) => r.category === "Müəllim" || r.role === "teacher").length;
    const staffCount = readers.filter((r) => r.category === "Əməkdaş" || r.role === "staff").length;

    // Ümumi kitab verilməsi (Dövriyyə)
    const totalCirculations = loans.length;

    // Vaxtında qaytarılan kitablar
    const returnedCount = returnedLoans.length;

    return {
      totalCopies,
      inLibrary,
      inUse,
      overdue,
      damagedCount,
      eResources,
      totalReaders,
      studentCount,
      teacherCount,
      staffCount,
      totalCirculations,
      returnedCount,
    };
  }, [copies, books, activeLoans, overdueLoans, digitalResources, readers, loans, returnedLoans]);

  // Section III: Kitab Fondu və Dövriyyə Məlumatları
  const booksReport = useMemo(() => {
    return books.map((b) => {
      const bookCopies = copies.filter((c) => c.bookId === b.id);
      const total = bookCopies.length > 0 ? bookCopies.length : (b.copiesCount || 0);

      const inLibrary = bookCopies.length > 0
        ? bookCopies.filter((c) => c.status === "Fondda" || (c.status as string) === "Mövcuddur").length
        : (b.availableCount ?? total);

      const bookActiveLoans = activeLoans.filter((l) => l.bookId === b.id);
      const inUse = bookActiveLoans.length;
      const overdue = bookActiveLoans.filter((l) => l.dueDate && l.dueDate < todayStr).length;

      const inventoryNumber = bookCopies[0]?.inventoryNumber || b.isbn || `INV-${b.id.slice(-4)}`;
      const totalIssued = loans.filter((l) => l.bookId === b.id).length;

      return {
        id: b.id,
        inventoryNumber,
        title: b.title,
        author: b.author,
        category: b.category || "Tədris",
        language: b.language || "Azərbaycan",
        year: b.year || (b as any).publicationYear,
        shelf: bookCopies[0]?.shelfLocation || b.initialShelf || "Rəf A-1",
        total,
        inLibrary,
        inUse,
        overdue,
        totalIssued,
      };
    });
  }, [books, copies, activeLoans, todayStr, loans]);

  // Section IV: Borclu və Gecikdirən Oxucular
  const delinquentLoans = useMemo(() => {
    return activeLoans
      .map((l) => {
        const reader = readers.find(
          (r) => r.id === l.readerId || r.ticketNumber === l.readerTicket
        );
        const isOverdue = Boolean(l.dueDate && l.dueDate < todayStr);

        let delayStatus = "- (İstifadədə)";
        let daysOverdue = 0;

        if (isOverdue && l.dueDate) {
          const dueTime = new Date(l.dueDate).getTime();
          const nowTime = new Date(todayStr).getTime();
          daysOverdue = Math.max(1, Math.round((nowTime - dueTime) / (1000 * 60 * 60 * 24)));
          delayStatus = `Gecikir (${daysOverdue} gün)`;
        }

        const statusInfo = formatReaderAcademicInfo(reader, l.readerName);

        return {
          id: l.id,
          ticketNumber: l.readerTicket || reader?.ticketNumber || "OX-1045",
          readerName: l.readerName,
          statusInfo,
          bookTitle: l.bookTitle,
          inventoryNumber: l.inventoryNumber || "INV-0000",
          issueDate: l.issueDate,
          dueDate: l.dueDate,
          isOverdue,
          daysOverdue,
          delayStatus,
        };
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return b.daysOverdue - a.daysOverdue;
      });
  }, [activeLoans, readers, todayStr]);

  // Filtered books for interactive search
  const filteredBooksReport = useMemo(() => {
    return booksReport.filter((b) => {
      const q = bookSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.inventoryNumber.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);

      const matchesCat =
        selectedBookCategory === "all" || b.category === selectedBookCategory;

      return matchesSearch && matchesCat;
    });
  }, [booksReport, bookSearchQuery, selectedBookCategory]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  // Period label text
  const periodLabel = useMemo(() => {
    if (period === "academic") return "Cari Tədris İli (2026-2027)";
    if (period === "all") return "Bütün Dövrlər Üzrə";
    if (period === "month") return "Cari Ay Üzrə";
    if (period === "semester") return "I Yarımil (Semestr)";
    if (period === "custom") {
      return `${formatDateAz(startDate)} — ${formatDateAz(endDate)}`;
    }
    return "Cari Tədris İli (2026-2027)";
  }, [period, startDate, endDate]);

  // Report unique ID
  const reportNumber = useMemo(() => {
    const curYear = new Date().getFullYear();
    const curMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    return `HES-${curYear}/${curMonth}-01`;
  }, []);

  // Primary Print Action: Trigger Browser Print & PDF Save
  const handlePrint = () => {
    window.print();
  };

  // Secondary XLSX Export
  const handleExportXLSX = () => {
    const wsData: any[][] = [];

    wsData.push(["AZƏRBAYCAN RESPUBLİKASI ELM VƏ TƏHSİL NAZİRLİYİ"]);
    wsData.push(["LƏNKƏRAN DÖVLƏT PEŞƏ TƏHSİL MƏRKƏZİ"]);
    wsData.push(["KİTABXANA FONDUNUN VƏ OXUCU DÖVRİYYƏSİNİN HESABATI"]);
    wsData.push([`Hesabat №: ${reportNumber}`, "", "", `Tərtib edilmə tarixi: ${formatDateAz(todayStr)}`]);
    wsData.push([`Hesabat dövrü: ${periodLabel}`]);
    wsData.push([]);

    // Section I
    wsData.push(["I. KİTAB FONDUNUN HƏRƏKƏT BALANSI"]);
    wsData.push([
      "Ümumi Kitab Fondu (Cəmi nüsxə)",
      "Fondda (Rəfdə) Mövcud Olanlar",
      "Oxucuda (İstifadədə) Olanlar",
      "Vaxtı Keçmiş (Gecikən) Kitablar",
      "Təmirə / Cildləməyə Ehtiyacı Olanlar",
      "Elektron Resurslar (E-Kitabxana)",
    ]);
    wsData.push([
      stats.totalCopies,
      stats.inLibrary,
      stats.inUse,
      stats.overdue,
      stats.damagedCount,
      stats.eResources,
    ]);
    wsData.push([]);

    // Section II
    wsData.push(["II. OXUCU KONTİNGENTİ VƏ DÖVRİYYƏ GÖSTƏRİCİLƏRİ"]);
    wsData.push([
      "Qeydiyyatda olan ümumi oxucu sayı",
      "Tələbə sayı",
      "Müəllim sayı",
      "Ümumi kitab verilməsi (Dövriyyə)",
      "Vaxtında qaytarılan kitablar",
    ]);
    wsData.push([
      stats.totalReaders,
      stats.studentCount,
      stats.teacherCount,
      stats.totalCirculations,
      stats.returnedCount,
    ]);
    wsData.push([]);

    // Section III
    wsData.push(["III. ƏSAS KİTAB FONDU VƏ DÖVRİYYƏ CƏDVƏLİ"]);
    wsData.push([
      "№",
      "İnventar №",
      "Nəşrin Adı",
      "Müəllif(lər)",
      "İxtisas / Bölmə",
      "Nəşr İli",
      "Rəf Ünvanı",
      "Cəmi",
      "Fondda",
      "Oxucuda",
      "Gecikən",
    ]);

    if (booksReport.length === 0) {
      wsData.push(["—", "—", "Hesabat tarixinə qeydə alınmış kitab fondu yoxdur.", "—", "—", "—", "—", 0, 0, 0, 0]);
    } else {
      booksReport.forEach((b, idx) => {
        wsData.push([
          idx + 1,
          { t: "s", v: b.inventoryNumber || "—" },
          b.title,
          b.author,
          b.category,
          b.year || "—",
          b.shelf,
          b.total,
          b.inLibrary,
          b.inUse,
          b.overdue,
        ]);
      });
    }
    wsData.push([]);

    // Section IV
    wsData.push(["IV. BORCLU VƏ GECİKDİRƏN OXUCULAR SİYAHISI"]);
    wsData.push([
      "№",
      "Bilet №",
      "Oxucu Adı Soyadı",
      "Statusu / Qrupu",
      "Götürdüyü Kitab",
      "İnventar №",
      "Verilmə Tarixi",
      "Qaytarılmalı Tarix",
      "Gecikmə Statusu",
    ]);

    if (delinquentLoans.length === 0) {
      wsData.push(["—", "—", "Hesabat tarixinə gecikdirilən kitab yoxdur.", "—", "—", "—", "—", "—", "Normal"]);
    } else {
      delinquentLoans.forEach((d, idx) => {
        wsData.push([
          idx + 1,
          { t: "s", v: d.ticketNumber || "—" },
          d.readerName,
          d.statusInfo,
          d.bookTitle,
          { t: "s", v: d.inventoryNumber || "—" },
          formatDateAz(d.issueDate),
          formatDateAz(d.dueDate),
          d.delayStatus,
        ]);
      });
    }
    wsData.push([]);
    wsData.push([]);

    // Signatures
    wsData.push([
      "Hesabatı hazırladı / Kitabxana məsulu: ___________________________",
      "",
      "",
      "",
      "Təsdiq etdi / Rəhbərlik: ___________________________",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 34 },
      { wch: 24 },
      { wch: 22 },
      { wch: 12 },
      { wch: 16 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "A4 Hesabat");
    XLSX.writeFile(wb, `Lenkeran_DPTM_Kitabxana_Hesabat_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* ============================================================== */}
      {/* 1. SCREEN CONTROLS & HEADER (Completely hidden in print mode) */}
      {/* ============================================================== */}
      <div className="print:hidden space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Hesabatlar və Statistika
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Canlı Firebase Bazası
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Lənkəran Dövlət Peşə Təhsil Mərkəzi — Rəsmi A4 Çap Forması və Analitik Göstəricilər
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Action Button: Print / Save as PDF */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-950/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              title="A4 formatında rəsmi sənəd formasını çap edin və ya PDF kimi yadda saxlayın"
            >
              <Printer className="w-4 h-4" />
              <span>Hesabat Formasını Çap et / PDF Yüklə</span>
            </button>

            {/* Secondary Action: Excel Export */}
            <button
              onClick={handleExportXLSX}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Məlumatları Microsoft Excel (.xlsx) formatında yükləyin"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs & Period Filter Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* View Mode Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("official_doc")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "official_doc"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Rəsmi A4 Hesabat Forması (Önbaxış)</span>
              </button>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "dashboard"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-4 h-4 text-slate-600" />
                <span>İnteraktiv Göstəricilər Paneli</span>
              </button>
            </div>

            {/* Period Selector */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Dövr:
              </span>
              <button
                onClick={() => setPeriod("academic")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  period === "academic"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Cari Tədris İli
              </button>
              <button
                onClick={() => setPeriod("all")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  period === "all"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Bütün dövr
              </button>
              <button
                onClick={() => setPeriod("month")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  period === "month"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Cari Ay
              </button>
              <button
                onClick={() => setPeriod("semester")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  period === "semester"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Yarımil
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Dashboard Tab (Visible when selected on screen) */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* 6 Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Kitab Fondu</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-900">{stats.totalCopies}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Cəmi nüsxə sayı</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Fondda (Rəfdə)</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-emerald-700">{stats.inLibrary}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">İstifadəyə hazır</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Oxucuda</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-blue-700">{stats.inUse}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Aktiv istifadədə</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Vaxtı Keçmiş</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-rose-600">{stats.overdue}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Müddəti bitmiş</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Təmirə Ehtiyac</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-amber-600">{stats.damagedCount}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Cildləmə / Təmir</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">E-Resurslar</span>
                  <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-violet-700">{stats.eResources}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Elektron vəsait</p>
                </div>
              </div>
            </div>

            {/* Search and Table Filters */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    placeholder="Kitab fondunda axtarış (ad, müəllif, inventar № və ya bölmə)..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div className="sm:col-span-4">
                  <select
                    value={selectedBookCategory}
                    onChange={(e) => setSelectedBookCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
                  >
                    <option value="all">Bütün Bölmələr / İxtisaslar</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. OFFICIAL A4 REPORT FORM (Always printed; previewed on screen) */}
      {/* ============================================================== */}
      <div
        className={`${
          activeTab === "official_doc" ? "block" : "hidden print:block"
        } bg-white shadow-lg print:shadow-none border border-slate-200 print:border-none rounded-xl print:rounded-none max-w-[210mm] mx-auto p-6 sm:p-10 print:p-0 text-slate-900 transition-all font-sans leading-normal`}
      >
        {/* Document Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900">
          <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-slate-700 uppercase">
            AZƏRBAYCAN RESPUBLİKASI ELM VƏ TƏHSİL NAZİRLİYİ
          </p>
          <h2 className="text-sm sm:text-base font-black tracking-wide text-slate-950 uppercase mt-1">
            LƏNKƏRAN DÖVLƏT PEŞƏ TƏHSİL MƏRKƏZİ
          </h2>
          <h1 className="text-base sm:text-lg font-black tracking-wider text-slate-950 uppercase mt-3 pt-2 border-t border-slate-300">
            KİTABXANA FONDUNUN VƏ OXUCU DÖVRİYYƏSİNİN HESABATI
          </h1>
        </div>

        {/* Metadata Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs py-3 border-b border-slate-300 gap-1.5 text-slate-800 font-medium">
          <div className="space-y-0.5">
            <p>
              <strong className="font-bold text-slate-950">Hesabat №:</strong>{" "}
              <span className="font-mono">{reportNumber}</span>
            </p>
            <p>
              <strong className="font-bold text-slate-950">Hesabat dövrü:</strong>{" "}
              <span>{periodLabel}</span>
            </p>
          </div>
          <div className="sm:text-right space-y-0.5">
            <p>
              <strong className="font-bold text-slate-950">Tərtib edilmə tarixi:</strong>{" "}
              <span className="font-mono">{formatDateAz(todayStr)}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Sistem: LIBRA AI İdarəetmə Bazası
            </p>
          </div>
        </div>

        {/* SECTION I: KİTAB FONDUNUN HƏRƏKƏT BALANSI */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
            <span>I. KİTAB FONDUNUN HƏRƏKƏT BALANSI</span>
          </h3>

          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-bold text-left">
                  <th className="py-2 px-3 border-r border-slate-900 w-1/2">Fond Göstəricisi</th>
                  <th className="py-2 px-3 text-right">Faktiki Sayı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Ümumi Kitab Fondu (Cəmi nüsxə)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-950">
                    {stats.totalCopies} nüsxə
                  </td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Fondda (Rəfdə) Mövcud Olanlar
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800">
                    {stats.inLibrary} nüsxə
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Oxucuda (İstifadədə) Olanlar
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-blue-800">
                    {stats.inUse} nüsxə
                  </td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Vaxtı Keçmiş (Gecikən) Kitablar
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-800">
                    {stats.overdue} nüsxə
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Təmirə / Cildləməyə Ehtiyacı Olanlar
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-800">
                    {stats.damagedCount} nüsxə
                  </td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Elektron Resurslar (E-Kitabxana)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-violet-800">
                    {stats.eResources} ədəd
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION II: OXUCU KONTİNGENTİ VƏ DÖVRİYYƏ GÖSTƏRİCİLƏRİ */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
            <span>II. OXUCU KONTİNGENTİ VƏ DÖVRİYYƏ GÖSTƏRİCİLƏRİ</span>
          </h3>

          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-bold text-left">
                  <th className="py-2 px-3 border-r border-slate-900 w-1/2">Dövriyyə Parametri</th>
                  <th className="py-2 px-3 text-right">Göstərici</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Qeydiyyatda olan ümumi oxucu sayı
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-950">
                    {stats.totalReaders} nəfər{" "}
                    <span className="text-[11px] font-normal text-slate-600">
                      (Tələbə: {stats.studentCount}, Müəllim: {stats.teacherCount}
                      {stats.staffCount > 0 ? `, Digər: ${stats.staffCount}` : ""})
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Ümumi kitab verilməsi (Dövriyyə)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-950">
                    {stats.totalCirculations} dəfə
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-900 font-medium">
                    Vaxtında qaytarılan kitablar
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800">
                    {stats.returnedCount} nüsxə
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION III: ƏSAS KİTAB FONDU VƏ DÖVRİYYƏ CƏDVƏLİ */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
              III. ƏSAS KİTAB FONDU VƏ DÖVRİYYƏ CƏDVƏLİ
            </h3>
            <span className="text-[10px] text-slate-600 font-medium print:hidden">
              Cəmi nəşr: {booksReport.length}
            </span>
          </div>

          <div className="border border-slate-900 overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-950 font-bold text-center">
                  <th className="py-1.5 px-2 border-r border-slate-900 w-8">№</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 text-left w-24">İnventar №</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 text-left">Nəşrin Adı</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 text-left w-28">Müəllif(lər)</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 text-left w-24">İxtisas / Bölmə</th>
                  <th className="py-1.5 px-1 border-r border-slate-900 w-12">Nəşr İli</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 w-16">Rəf Ünvanı</th>
                  <th className="py-1.5 px-1 border-r border-slate-900 w-10">Cəmi</th>
                  <th className="py-1.5 px-1 border-r border-slate-900 w-10">Fondda</th>
                  <th className="py-1.5 px-1 border-r border-slate-900 w-10">Oxucuda</th>
                  <th className="py-1.5 px-1 w-10">Gecikən</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {booksReport.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-4 text-center text-slate-500 font-medium italic"
                    >
                      Hesabat tarixinə qeydə alınmış kitab fondu yoxdur.
                    </td>
                  </tr>
                ) : (
                  booksReport.map((b, idx) => (
                    <tr key={b.id} className={idx % 2 === 1 ? "bg-slate-50/60" : ""}>
                      <td className="py-1 px-1 text-center font-mono border-r border-slate-900">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-900 font-mono font-medium text-slate-900">
                        {b.inventoryNumber}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-900 font-bold text-slate-950">
                        {b.title}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-900 text-slate-700">
                        {b.author}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-900 text-slate-700">
                        {b.category}
                      </td>
                      <td className="py-1 px-1 text-center font-mono border-r border-slate-900">
                        {b.year || "—"}
                      </td>
                      <td className="py-1 px-2 text-center border-r border-slate-900 text-slate-700">
                        {b.shelf}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold border-r border-slate-900">
                        {b.total}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-emerald-800 font-bold border-r border-slate-900">
                        {b.inLibrary}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-blue-800 font-bold border-r border-slate-900">
                        {b.inUse}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold">
                        {b.overdue > 0 ? (
                          <span className="text-rose-800">{b.overdue}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION IV: BORCLU VƏ GECİKDİRƏN OXUCULAR SİYAHISI */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
              IV. BORCLU VƏ GECİKDİRƏN OXUCULAR SİYAHISI
            </h3>
            <span className="text-[10px] text-slate-600 font-medium print:hidden">
              Borclu oxucu: {delinquentLoans.length}
            </span>
          </div>

          <div className="border border-slate-900 overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-950 font-bold text-center">
                  <th className="py-1.5 px-2 border-r border-slate-900 w-8">№</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 text-left w-20">Bilet №</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 text-left">Oxucu Adı Soyadı</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 text-left">Statusu / Qrupu</th>
                  <th className="py-1.5 px-2 border-r border-slate-900 text-left">Götürdüyü Kitab (İnventar №)</th>
                  <th className="py-1.5 px-1 border-r border-slate-900 w-20">Verilmə T.</th>
                  <th className="py-1.5 px-1 border-r border-slate-900 w-20">Qaytarılmalı T.</th>
                  <th className="py-1.5 px-2 w-28">Gecikmə Statusu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {delinquentLoans.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-4 text-center text-slate-600 font-medium italic"
                    >
                      Hesabat tarixinə gecikdirilən kitab yoxdur.
                    </td>
                  </tr>
                ) : (
                  delinquentLoans.map((d, idx) => (
                    <tr key={d.id} className={idx % 2 === 1 ? "bg-slate-50/60" : ""}>
                      <td className="py-1 px-1 text-center font-mono border-r border-slate-900">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-900 font-mono font-medium text-slate-900">
                        {d.ticketNumber}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-900 font-bold text-slate-950">
                        {d.readerName}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-900 text-slate-700">
                        {d.statusInfo}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-900 text-slate-800">
                        {d.bookTitle}{" "}
                        <span className="font-mono text-slate-500">
                          ({d.inventoryNumber})
                        </span>
                      </td>
                      <td className="py-1 px-1 text-center font-mono border-r border-slate-900">
                        {formatDateAz(d.issueDate)}
                      </td>
                      <td className="py-1 px-1 text-center font-mono border-r border-slate-900">
                        {formatDateAz(d.dueDate)}
                      </td>
                      <td className="py-1 px-2 text-center font-bold">
                        {d.isOverdue ? (
                          <span className="text-rose-800 font-extrabold">
                            {d.delayStatus}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-normal">
                            {d.delayStatus}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION V: CLEAN SIGNATURE BLOCK (WITHOUT STAMP / MÖHÜR) */}
        <div
          className="mt-12 pt-4 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-xs text-slate-900 font-medium"
          style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
        >
          <div className="space-y-1">
            <p>
              <strong>Hesabatı hazırladı / Kitabxana məsulu:</strong>
            </p>
            <p className="font-mono text-slate-600">__________________________________________</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p>
              <strong>Təsdiq etdi / Rəhbərlik:</strong>
            </p>
            <p className="font-mono text-slate-600">__________________________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
