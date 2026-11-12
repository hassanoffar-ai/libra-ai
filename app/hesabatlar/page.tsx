"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
  Search,
  Filter,
  Laptop,
  MapPin,
  ShieldAlert,
  ArrowRight,
  BookX,
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

type PeriodPreset = "all" | "today" | "week" | "month" | "semester" | "custom";

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
    const details = reader.position || reader.department || "İxtisas fənn müəllimi";
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

  // Time Period Filter
  const [period, setPeriod] = useState<PeriodPreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Table Filters
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

  // Calculate Date Bounds based on Preset
  const { filterStart, filterEnd } = useMemo(() => {
    const now = new Date();
    let s = new Date(2000, 0, 1);
    const e = new Date();

    if (period === "all") {
      return { filterStart: "2000-01-01", filterEnd: todayStr };
    } else if (period === "today") {
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

  // Active Loans (status 'Aktiv' or 'Gecikib' or no returnDate)
  const activeLoans = useMemo(() => {
    return loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib" || !l.returnDate);
  }, [loans]);

  // Overdue Loans
  const overdueLoans = useMemo(() => {
    return activeLoans.filter((l) => l.dueDate < todayStr);
  }, [activeLoans, todayStr]);

  // ================= 1. REAL-TIME SUMMARY STATS (ÜMUMİ GÖSTƏRİCİLƏR) =================
  const summaryStats = useMemo(() => {
    // 1. Ümumi Kitab Fondu: Total physical copies
    const totalCopies = copies.length > 0
      ? copies.length
      : books.reduce((acc, b) => acc + (b.copiesCount || 0), 0);

    // 2. Fondda (Rəfdə) Olanlar: status is 'Fondda' or 'Mövcuddur' and not currently loaned out
    const inLibrary = copies.length > 0
      ? copies.filter((c) => c.status === "Fondda" || (c.status as string) === "Mövcuddur").length
      : books.reduce((acc, b) => acc + (b.availableCount ?? b.copiesCount ?? 0), 0);

    // 3. Oxucuda (İstifadədə) Olanlar: Total active loans
    const inUse = activeLoans.length;

    // 4. Vaxtı Keçmiş (Gecikən): dueDate < todayStr
    const overdue = overdueLoans.length;

    // 5. Elektron Resurslar: total in /e-kitabxana collection
    const eResources = digitalResources.length;

    // 6. Aktiv Oxucu Sayı: unique count of validated active readers
    const activeReaders = readers.filter(
      (r) => r.status === "active" || r.status === "Aktiv" || !r.status
    ).length;

    return {
      totalCopies,
      inLibrary,
      inUse,
      overdue,
      eResources,
      activeReaders,
    };
  }, [copies, books, activeLoans, overdueLoans, digitalResources, readers]);

  // ================= 2. ESAS CƏDVƏL - KITAB FONDU VƏ DÖVRİYYƏ =================
  const booksReport = useMemo(() => {
    return books.map((b) => {
      const bookCopies = copies.filter((c) => c.bookId === b.id);
      const totalCount = bookCopies.length > 0 ? bookCopies.length : (b.copiesCount || 0);

      // Fondda olan nüsxələr
      const inLibraryCount = bookCopies.length > 0
        ? bookCopies.filter((c) => c.status === "Fondda" || (c.status as string) === "Mövcuddur").length
        : (b.availableCount ?? totalCount);

      // Oxucuda olan aktiv istiqrazlar
      const bookActiveLoans = activeLoans.filter((l) => l.bookId === b.id);
      const inUseCount = bookActiveLoans.length;

      // Gecikən istiqrazlar
      const overdueCount = bookActiveLoans.filter((l) => l.dueDate < todayStr).length;

      // Primary inventory number or ISBN
      const primaryInventory = bookCopies[0]?.inventoryNumber || b.isbn || `INV-${b.id.slice(-4)}`;

      // Primary condition
      const condition = bookCopies[0]?.condition || "Yaxşı";

      // Cumulative lifetime loans
      const totalIssued = loans.filter((l) => l.bookId === b.id).length;

      return {
        id: b.id,
        inventoryNumber: primaryInventory,
        title: b.title,
        author: b.author,
        category: b.category,
        language: b.language || "Azərbaycan",
        year: b.year ? String(b.year) : "—",
        shelf: b.initialShelf || "Zal 1, Rəf A-1",
        total: totalCount,
        inLibrary: inLibraryCount,
        inUse: inUseCount,
        overdue: overdueCount,
        condition,
        totalIssued,
      };
    });
  }, [books, copies, loans, activeLoans, todayStr]);

  // Filtered Books for UI Table
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

  // Unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  // ================= 3. BORCLU VƏ GECİKDIRƏN OXUCULAR =================
  const delinquentLoans = useMemo(() => {
    return activeLoans
      .map((l) => {
        const reader = readers.find(
          (r) => r.id === l.readerId || r.ticketNumber === l.readerTicket
        );
        const isOverdue = l.dueDate < todayStr;

        let delayStatus = "- (İstifadədə)";
        let daysOverdue = 0;

        if (isOverdue) {
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
          inventoryNumber: l.inventoryNumber,
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

  // Top Borrowed Books Ranking
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

  // ================= 4. REAL DATABASE EXCEL EXPORT GENERATOR (.xlsx) =================
  const handleExportXLSX = () => {
    const wsData: any[][] = [];

    // Row 1-2: Title header in Bold
    wsData.push(["LƏNKƏRAN DÖVLƏT PEŞƏ TƏHSİL MƏRKƏZİ — KİTABXANA İDARƏETMƏ VƏ DÖVRİYYƏ HESABATI"]);
    wsData.push([`Tərtib edilmə tarixi: ${formatDateAz(todayStr)} | Sistem: LIBRA AI Real Verilənlər Bazası`]);
    wsData.push([]); // blank separator

    // Row 4-6: I. Ümumi İcmal və Statistika Göstəriciləri
    wsData.push(["I. ÜMUMİ İCMAL VƏ STATİSTİKA GÖSTƏRİCİLƏRİ"]);
    wsData.push([
      "Ümumi Kitab Fondu",
      "Fondda (Rəfdə) Olanlar",
      "Oxucuda (İstifadədə) Olanlar",
      "Vaxtı Keçmiş (Gecikən)",
      "Elektron Resurslar",
      "Aktiv Oxucu Sayı",
    ]);
    wsData.push([
      summaryStats.totalCopies,
      summaryStats.inLibrary,
      summaryStats.inUse,
      summaryStats.overdue,
      summaryStats.eResources,
      summaryStats.activeReaders,
    ]);
    wsData.push([]); // blank separator

    // Row 8+: II. Əsas Kitab Fondu və Dövriyyə Cədvəli
    wsData.push(["II. ƏSAS KİTAB FONDU VƏ DÖVRİYYƏ CƏDVƏLİ"]);
    wsData.push([
      "№ / İnventar №",
      "Nəşrin Adı",
      "Müəllif(lər)",
      "İxtisas / Bölmə",
      "Dil",
      "Nəşr İli",
      "Rəf Ünvanı",
      "Cəmi Nüsxə",
      "Fondda (Rəfdə)",
      "Oxucuda",
      "Gecikən",
      "Fiziki Vəziyyəti",
      "Ümumi Verilmə Sayı",
    ]);

    if (booksReport.length === 0) {
      wsData.push(["—", "Hələ heç bir kitab qeydə alınmayıb", "—", "—", "—", "—", "—", 0, 0, 0, 0, "—", 0]);
    } else {
      booksReport.forEach((b) => {
        wsData.push([
          { t: "s", v: b.inventoryNumber || "—" },
          b.title,
          b.author,
          b.category,
          b.language,
          b.year || "—",
          b.shelf,
          b.total,
          b.inLibrary,
          b.inUse,
          b.overdue,
          b.condition,
          b.totalIssued,
        ]);
      });
    }
    wsData.push([]); // blank separator

    // Row: III. Borclu və Gecikdirən Oxucular
    wsData.push(["III. BORCLU VƏ GECİKDİRƏN OXUCULAR (MÜDDƏTİ ÖTƏN VƏ YA AKTİV BORC)"]);
    wsData.push([
      "№",
      "Bilet №",
      "Oxucu Adı Soyadı",
      "Statusu / Qrupu / Vəzifəsi",
      "Götürdüyü Kitab",
      "İnventar №",
      "Verilmə Tarixi",
      "Qaytarılmalı Tarix",
      "Gecikmə Vəziyyəti",
    ]);

    if (delinquentLoans.length === 0) {
      wsData.push(["—", "—", "Hazırda borclu və ya gecikdirən oxucu yoxdur", "—", "—", "—", "—", "—", "Normal"]);
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
    wsData.push([]); // blank separator
    wsData.push([]); // blank separator

    // Bottom Rows: Official signing sections
    wsData.push([
      "Hesabatı hazırladı / Kitabxana məsulu: ___________________________",
      "",
      "",
      "",
      "Təsdiq etdi / Rəhbərlik: ___________________________",
    ]);
    wsData.push([
      "İmza / Tarix: ___________________________",
      "",
      "",
      "",
      "İmza / Möhür: ___________________________",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for clean readability
    ws["!cols"] = [
      { wch: 22 }, // A: № / İnventar / Bilet
      { wch: 34 }, // B: Nəşrin Adı / Oxucu
      { wch: 24 }, // C: Müəllif / Status
      { wch: 24 }, // D: İxtisas / Kitab
      { wch: 14 }, // E: Dil / İnventar
      { wch: 12 }, // F: İl / Verilmə
      { wch: 18 }, // G: Rəf / Qaytarılmalı
      { wch: 12 }, // H: Cəmi / Gecikmə
      { wch: 14 }, // I: Fondda
      { wch: 12 }, // J: Oxucuda
      { wch: 12 }, // K: Gecikən
      { wch: 16 }, // L: Vəziyyəti
      { wch: 18 }, // M: Ümumi Verilmə
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dövriyyə Hesabatı");

    XLSX.writeFile(wb, `Lenkeran_Pese_Kitabxana_Hesabat_${todayStr}.xlsx`);
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
              Real Firebase Bazası
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lənkəran Dövlət Peşə Təhsil Mərkəzinin canlı kitabxana fondu, rəf vəziyyəti və dövriyyə hesabatı
          </p>
        </div>

        {/* Action Buttons: Export XLSX & Print */}
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={handleExportXLSX}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Microsoft Excel formatında (.xlsx) rəsmi hesabatı endir"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel-ə köçür (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Çap üçün rəsmi forma hazırla"
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
          Kitabxana İdarəetmə və Dövriyyə Hesabatı
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Dövr: {period === "all" ? "Bütün dövr" : `${formatDateAz(filterStart)} — ${formatDateAz(filterEnd)}`} | Tərtib tarixi: {formatDateAz(todayStr)}
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

      {/* ================= 1. REAL-TIME SUMMARY STATS (ÜMUMİ GÖSTƏRİCİLƏR) ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Ümumi Kitab Fondu */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ümumi Fond</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 font-mono">
            {summaryStats.totalCopies}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Fiziki nüsxə sayı</p>
        </div>

        {/* Fondda (Rəfdə) Olanlar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fondda (Rəfdə)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono">
            {summaryStats.inLibrary}
          </span>
          <p className="text-[10px] text-emerald-600 mt-0.5 truncate">Hazırda mövcud olan</p>
        </div>

        {/* Oxucuda (İstifadədə) Olanlar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Oxucuda Olanlar</span>
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-700 font-mono">
            {summaryStats.inUse}
          </span>
          <p className="text-[10px] text-amber-600 mt-0.5 truncate">Aktiv istiqrazda</p>
        </div>

        {/* Vaxtı Keçmiş (Gecikən) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vaxtı Keçmiş</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-extrabold text-rose-600 font-mono">
            {summaryStats.overdue}
          </span>
          <p className="text-[10px] text-rose-500 mt-0.5 truncate">Müddəti ötən nüsxə</p>
        </div>

        {/* Elektron Resurslar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">E-Resurslar</span>
            <Laptop className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-2xl font-extrabold text-sky-700 font-mono">
            {summaryStats.eResources}
          </span>
          <p className="text-[10px] text-sky-600 mt-0.5 truncate">Rəqəmsal dərslik və vəsait</p>
        </div>

        {/* Aktiv Oxucu Sayı */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aktiv Oxucular</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-extrabold text-purple-700 font-mono">
            {summaryStats.activeReaders}
          </span>
          <p className="text-[10px] text-purple-600 mt-0.5 truncate">Təsdiqlənmiş oxucu</p>
        </div>
      </div>

      {/* ================= 2. ESAS CƏDVƏL - KITAB FONDU VƏ DÖVRİYYƏ ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Əsas Kitab Fondu və Dövriyyə Cədvəli
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hər bir nəşr üzrə fiziki fond, mövcudluq, rəf yeri və ümumi verilmə statistikası
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto font-mono">
            {filteredBooksReport.length} adda kitab
          </span>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Kitab adı, müəllif, inventar və ya açar sözlə axtarış..."
              value={bookSearchQuery}
              onChange={(e) => setBookSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <select
              value={selectedBookCategory}
              onChange={(e) => setSelectedBookCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-medium"
            >
              <option value="all">Bütün İxtisaslar / Bölmələr</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredBooksReport.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <BookX className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">
              {books.length === 0
                ? "Hələ heç bir kitab əlavə edilməyib"
                : "Axtarışa uyğun kitab tapılmadı"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {books.length === 0
                ? "Kitabxanaçı fonda yeni nəşrlər əlavə etdikdə burada tam dövriyyə cədvəli əks olunacaqdır."
                : "Filtrləri sıfırlayaraq yenidən yoxlayın."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">№ / İnventar №</th>
                  <th className="py-2.5 px-3">Nəşrin Adı & Müəllif</th>
                  <th className="py-2.5 px-3">İxtisas / Bölmə</th>
                  <th className="py-2.5 px-3">Dil / İl</th>
                  <th className="py-2.5 px-3">Rəf Ünvanı</th>
                  <th className="py-2.5 px-2.5 text-center">Cəmi</th>
                  <th className="py-2.5 px-2.5 text-center text-emerald-700">Fondda</th>
                  <th className="py-2.5 px-2.5 text-center text-amber-700">Oxucuda</th>
                  <th className="py-2.5 px-2.5 text-center text-rose-700">Gecikən</th>
                  <th className="py-2.5 px-3 text-center">Vəziyyəti</th>
                  <th className="py-2.5 px-3 text-right">Ümumi Verilmə</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooksReport.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {b.inventoryNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 leading-snug">{b.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{b.author}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {b.language} • {b.year}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        <span>{b.shelf}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-bold font-mono text-slate-800">
                      {b.total}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-bold font-mono text-emerald-700 bg-emerald-50/40">
                      {b.inLibrary}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-bold font-mono text-amber-700 bg-amber-50/40">
                      {b.inUse}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-bold font-mono text-rose-700 bg-rose-50/40">
                      {b.overdue > 0 ? (
                        <span className="text-rose-600 font-extrabold">{b.overdue}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          (b.condition as string) === "Yaxşı" || (b.condition as string) === "Əla"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : (b.condition as string) === "Təmirə ehtiyac var" || (b.condition as string) === "Köhnəlmiş"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : (b.condition as string) === "Yararsız"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {b.condition}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {b.totalIssued} dəfə
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= 3. BORCLU VƏ GECİKDIRƏN OXUCULAR ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Borclu və Gecikdirən Oxucular
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hazırda kitabxana fondundan kitab götürmüş və ya qaytarılma müddəti ötmüş oxucuların canlı siyahısı
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {delinquentLoans.length} aktiv borc
            </span>
            {summaryStats.overdue > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {summaryStats.overdue} gecikir
              </span>
            )}
          </div>
        </div>

        {delinquentLoans.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-700">Hazırda aktiv borclu və ya gecikdirən oxucu qeydə alınmayıb!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bütün nüsxələr vaxtında təhvil verilib və ya fonddadır.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Bilet №</th>
                  <th className="py-2.5 px-3">Oxucu Adı Soyadı</th>
                  <th className="py-2.5 px-3">Statusu / Qrupu / Vəzifəsi</th>
                  <th className="py-2.5 px-3">Götürdüyü Kitab və İnventar</th>
                  <th className="py-2.5 px-3">Verilmə Tarixi</th>
                  <th className="py-2.5 px-3">Qaytarılmalı Tarix</th>
                  <th className="py-2.5 px-3 text-right">Gecikmə Vəziyyəti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {delinquentLoans.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.isOverdue ? "hover:bg-rose-50/30 bg-rose-50/10" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {item.ticketNumber}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {item.readerName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {item.statusInfo}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900 leading-snug">{item.bookTitle}</div>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">
                        {item.inventoryNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateAz(item.issueDate)}
                    </td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                      <span className={item.isOverdue ? "text-rose-600 font-bold" : "text-slate-800"}>
                        {formatDateAz(item.dueDate)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {item.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>{item.delayStatus}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>- (İstifadədə)</span>
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

      {/* ================= 4. REYTİNQLƏR: ƏN FƏAL OXUCULAR & ƏN ÇOX VERİLƏN NƏŞRLƏR ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Ən Fəal Oxucular */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Ən Fəal Oxucular
            </h2>
            <span className="text-xs text-slate-400 font-medium">Top 5 Oxucu</span>
          </div>

          {topReaders.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Hələ heç bir oxu statistikası formalaşmayıb.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topReaders.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{r.readerName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Bilet: {r.ticket} • {r.dept}</p>
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

        {/* Ən Çox Müraciət Olunan İxtisas Dərslikləri */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Ən Çox Müraciət Olunan Nəşrlər
            </h2>
            <span className="text-xs text-slate-400 font-medium">Top 5 Nəşr</span>
          </div>

          {topBooks.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Hələ heç bir kitab istiqrazı formalaşmayıb.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topBooks.map((b, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/60"
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
          <p className="font-semibold">Hesabatı hazırladı / Kitabxana məsulu: _______________________</p>
          <p className="text-[10px] text-slate-500 mt-1">(İmza / Tarix)</p>
        </div>
        <div>
          <p className="font-semibold">Təsdiq etdi / Rəhbərlik: _______________________</p>
          <p className="text-[10px] text-slate-500 mt-1">(İmza / Möhür)</p>
        </div>
      </div>
    </div>
  );
}
