"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
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
    const groupOrDept = reader.department || reader.specialty;
    return groupOrDept ? `Tələbə (${groupOrDept})` : "Tələbə";
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
      const primaryInventory = bookCopies[0]?.inventoryNumber || b.isbn || `INV-${b.id.slice(-5)}`;

      // Primary condition
      const rawCondition = bookCopies[0]?.condition;
      const condition = rawCondition === "Yararsız" ? "Yararsız" : rawCondition === "Təmirə ehtiyac var" ? "Yaxşı" : "Əla";

      // Total lifetime issues
      const totalIssued = loans.filter((l) => l.bookId === b.id).length;

      const shelf = bookCopies[0]?.shelfLocation || (b as any).shelfLocation || (b as any).initialShelf || "Zal 1, Rəf A-1";

      return {
        id: b.id,
        inventoryNumber: primaryInventory,
        title: b.title,
        author: b.author,
        category: b.category || "Ümumtəhsil",
        language: b.language || "Az",
        year: b.year || 2023,
        shelf,
        total: totalCount,
        inLibrary: inLibraryCount,
        inUse: inUseCount,
        overdue: overdueCount,
        condition,
        totalIssued,
      };
    });
  }, [books, copies, activeLoans, loans, todayStr]);

  // ================= 3. BORCLU VƏ GECİKDIRƏN OXUCULAR =================
  const delinquentLoans = useMemo(() => {
    return activeLoans
      .map((l) => {
        const reader = readers.find(
          (r) => r.id === l.readerId || r.ticketNumber === l.readerTicket
        );
        const isOverdue = Boolean(l.dueDate && l.dueDate < todayStr);

        let delayStatus = "— (İstifadədə)";
        let daysOverdue = 0;

        if (isOverdue && l.dueDate) {
          const dueTime = new Date(l.dueDate).getTime();
          const nowTime = new Date(todayStr).getTime();
          daysOverdue = Math.max(1, Math.round((nowTime - dueTime) / (1000 * 60 * 60 * 24)));
          delayStatus = `Gecikir (${daysOverdue} gün)`;
        } else if (!l.dueDate) {
          delayStatus = "—";
        }

        const statusInfo = formatReaderAcademicInfo(reader, l.readerName);

        // Combined Book Title + Inventory (e.g. "İKT (INV-00124)")
        const displayBookWithInv = l.inventoryNumber
          ? `${l.bookTitle} (${l.inventoryNumber})`
          : l.bookTitle;

        return {
          id: l.id,
          ticketNumber: l.readerTicket || reader?.ticketNumber || "OX-1045",
          readerName: l.readerName,
          statusInfo,
          bookWithInv: displayBookWithInv,
          bookTitle: l.bookTitle,
          inventoryNumber: l.inventoryNumber || "—",
          issueDate: l.issueDate,
          dueDate: l.dueDate || "Tədris ili sonu",
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

  // ================= 4. REAL DATABASE EXCEL EXPORT GENERATOR (.xlsx) =================
  const handleExportXLSX = () => {
    const wsData: any[][] = [];

    // Row 1-2: Title header in Bold
    wsData.push(["LƏNKƏRAN DÖVLƏT PEŞƏ TƏHSİL MƏRKƏZİ — KİTABXANA İDARƏETMƏ VƏ DÖVRİYYƏ HESABATI"]);
    wsData.push([`Hesabatın tarixi: ${formatDateAz(todayStr)} | Real Verilənlər Bazası`]);
    wsData.push([]); // blank separator

    // Row 4-6: I. Ümumi İcmal və Statistika Göstəriciləri
    wsData.push(["I. ÜMUMİ İCMAL VƏ STATİSTİKA GÖSTƏRİCİLƏRİ"]);
    wsData.push([
      "Ümumi Kitab Fondu",
      "Fondda (Rəfdə)",
      "Oxucuda (İstifadədə)",
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
      "Cəmi",
      "Fondda",
      "Oxucuda",
      "Gecikən",
      "Vəziyyəti",
      "Ümumi Verilmə",
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
    wsData.push(["III. BORCLU VƏ GECİKDİRƏN OXUCULAR"]);
    wsData.push([
      "Bilet №",
      "Oxucu Adı Soyadı",
      "Statusu / Qrupu",
      "Götürdüyü Kitab",
      "Verilmə T.",
      "Qaytarılmalı T.",
      "Gecikmə",
    ]);

    if (delinquentLoans.length === 0) {
      wsData.push(["—", "Hazırda borclu və ya gecikdirən oxucu yoxdur", "—", "—", "—", "—", "—"]);
    } else {
      delinquentLoans.forEach((d) => {
        wsData.push([
          { t: "s", v: d.ticketNumber || "—" },
          d.readerName,
          d.statusInfo,
          d.bookWithInv,
          formatDateAz(d.issueDate),
          d.dueDate === "Tədris ili sonu" ? "Tədris ili sonu" : formatDateAz(d.dueDate),
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

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for clean readability
    ws["!cols"] = [
      { wch: 18 }, // A: № / İnventar / Bilet
      { wch: 32 }, // B: Nəşrin Adı / Oxucu
      { wch: 26 }, // C: Müəllif / Status
      { wch: 26 }, // D: İxtisas / Kitab
      { wch: 12 }, // E: Dil / Verilmə T
      { wch: 14 }, // F: İl / Qaytarılmalı T
      { wch: 18 }, // G: Rəf / Gecikmə
      { wch: 10 }, // H: Cəmi
      { wch: 10 }, // I: Fondda
      { wch: 10 }, // J: Oxucuda
      { wch: 10 }, // K: Gecikən
      { wch: 14 }, // L: Vəziyyəti
      { wch: 16 }, // M: Ümumi Verilmə
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hesabat");

    XLSX.writeFile(wb, `Lenkeran_Pese_Kitabxana_Hesabat_${todayStr}.xlsx`);
  };

  // Trigger Print Form
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4 print:bg-white print:text-black">
      {/* 1. Header (Screen & Print Header) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#1E3A5F] print:border-slate-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight print:text-slate-900">
            Kitabxana İdarəetmə və Dövriyyə Hesabatı
          </h1>
        </div>

        {/* Right side: Hesabatın tarixi + Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-sm font-medium text-slate-200 print:text-slate-600">
            Hesabatın tarixi: <span className="font-bold text-white print:text-slate-900">{formatDateAz(todayStr)}</span>
          </span>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#16365C] hover:bg-[#1E4472] border border-[#2A5282] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer print:hidden"
            title="Çap et və ya PDF kimi yadda saxla"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>Çap et / PDF</span>
          </button>

          <button
            onClick={handleExportXLSX}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer print:hidden"
            title="Microsoft Excel formatında (.xlsx) rəsmi hesabatı endir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel-ə köçür (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-sky-300 print:hidden">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Canlı verilənlər bazasından məlumatlar sinxronlaşdırılır...</span>
        </div>
      )}

      {/* ================= 1. REAL-TIME SUMMARY STATS (ÜMUMİ GÖSTƏRİCİLƏR) ================= */}
      <div className="space-y-2">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white print:text-slate-900">
          ÜMUMİ GÖSTƏRİCİLƏR <span className="text-slate-300 print:text-slate-500 font-normal lowercase">(Statistika Kartları)</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Ümumi Kitab Fondu */}
          <div className="bg-white rounded p-3 text-slate-800 shadow flex flex-col justify-between border border-slate-200">
            <span className="text-xs font-bold text-slate-700 truncate">Ümumi Kitab Fondu</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-950 my-0.5 tracking-tight">
              {summaryStats.totalCopies.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 truncate">Cəmi fiziki nüsxə</span>
          </div>

          {/* Card 2: Fondda (Rəfdə) */}
          <div className="bg-white rounded p-3 text-slate-800 shadow flex flex-col justify-between border border-slate-200">
            <span className="text-xs font-bold text-slate-700 truncate">Fondda (Rəfdə)</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-950 my-0.5 tracking-tight">
              {summaryStats.inLibrary.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 truncate">İstifadəyə hazır</span>
          </div>

          {/* Card 3: Oxucuda (İstifadədə) */}
          <div className="bg-white rounded p-3 text-slate-800 shadow flex flex-col justify-between border border-slate-200">
            <span className="text-xs font-bold text-slate-700 truncate">Oxucuda (İstifadədə)</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-950 my-0.5 tracking-tight">
              {summaryStats.inUse.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 truncate">Tələbə və müəllimlərdə</span>
          </div>

          {/* Card 4: Vaxtı Keçmiş (Gecikən) */}
          <div className="bg-white rounded p-3 text-slate-800 shadow flex flex-col justify-between border border-slate-200">
            <span className="text-xs font-bold text-slate-700 truncate">Vaxtı Keçmiş (Gecikən)</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-950 my-0.5 tracking-tight">
              {summaryStats.overdue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 truncate">Qaytarılma tarixi bitən</span>
          </div>

          {/* Card 5: Elektron Resurslar */}
          <div className="bg-white rounded p-3 text-slate-800 shadow flex flex-col justify-between border border-slate-200">
            <span className="text-xs font-bold text-slate-700 truncate">Elektron Resurslar</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-950 my-0.5 tracking-tight">
              {summaryStats.eResources.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 truncate">Yüklənmiş e-kitablar</span>
          </div>

          {/* Card 6: Aktiv Oxucu Sayı */}
          <div className="bg-white rounded p-3 text-slate-800 shadow flex flex-col justify-between border border-slate-200">
            <span className="text-xs font-bold text-slate-700 truncate">Aktiv Oxucu Sayı</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-950 my-0.5 tracking-tight">
              {summaryStats.activeReaders.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 truncate">Tələbə və müəllimlər</span>
          </div>
        </div>
      </div>

      {/* ================= 2. ESAS CƏDVƏL - KITAB FONDU VƏ DÖVRİYYƏ ================= */}
      <div className="space-y-2">
        <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider print:text-slate-900">
          ƏSAS CƏDVƏL - Kitab Fondu və Dövriyyə
        </h2>

        <div className="overflow-x-auto bg-white rounded border border-[#1E3A5F] shadow print:border-slate-300">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0E355E] text-white text-[11px] font-bold">
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">№ / İnventar №</th>
                <th className="py-2.5 px-3 text-left border border-[#1E4D7A] whitespace-nowrap">Nəşrin Adı</th>
                <th className="py-2.5 px-3 text-left border border-[#1E4D7A] whitespace-nowrap">Müəllif(lər)</th>
                <th className="py-2.5 px-3 text-left border border-[#1E4D7A] whitespace-nowrap">İxtisas / Bölmə</th>
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">Dil</th>
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">Nəşr İli</th>
                <th className="py-2.5 px-3 text-center border border-[#1E4D7A] whitespace-nowrap">Rəf Ünvanı</th>
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">Cəmi</th>
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">Fondda</th>
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">Oxucuda</th>
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">Gecikən</th>
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">Vəziyyəti</th>
                <th className="py-2.5 px-2 text-center border border-[#1E4D7A] whitespace-nowrap">Ümumi Verilmə</th>
              </tr>
            </thead>
            <tbody className="bg-white text-slate-900 text-[11px] sm:text-xs">
              {booksReport.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500 font-medium border border-slate-300">
                    Hələ heç bir kitab qeydə alınmayıb.
                  </td>
                </tr>
              ) : (
                booksReport.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 text-center font-mono border border-slate-300 whitespace-nowrap">
                      {b.inventoryNumber}
                    </td>
                    <td className="py-2 px-3 text-left font-medium border border-slate-300">
                      {b.title}
                    </td>
                    <td className="py-2 px-3 text-left border border-slate-300">
                      {b.author}
                    </td>
                    <td className="py-2 px-3 text-left border border-slate-300">
                      {b.category}
                    </td>
                    <td className="py-2 px-2 text-center border border-slate-300">
                      {b.language}
                    </td>
                    <td className="py-2 px-2 text-center border border-slate-300">
                      {b.year}
                    </td>
                    <td className="py-2 px-3 text-center border border-slate-300 whitespace-nowrap">
                      {b.shelf}
                    </td>
                    <td className="py-2 px-2 text-center font-bold border border-slate-300">
                      {b.total}
                    </td>
                    <td className="py-2 px-2 text-center font-bold border border-slate-300">
                      {b.inLibrary}
                    </td>
                    <td className="py-2 px-2 text-center font-bold border border-slate-300">
                      {b.inUse}
                    </td>
                    <td className="py-2 px-2 text-center font-bold border border-slate-300">
                      {b.overdue > 0 ? (
                        <span className="text-red-600 font-bold">{b.overdue}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="py-2 px-2 text-center border border-slate-300">
                      {b.condition}
                    </td>
                    <td className="py-2 px-2 text-center font-bold border border-slate-300">
                      {b.totalIssued}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 3. BORCLU VƏ GECİKDIRƏN OXUCULAR ================= */}
      <div className="space-y-2">
        <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider print:text-slate-900">
          Borclu və Gecikdirən Oxucular
        </h2>

        <div className="overflow-x-auto bg-white rounded border border-[#1E3A5F] shadow print:border-slate-300">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0E355E] text-white text-[11px] font-bold">
                <th className="py-2.5 px-3 text-center border border-[#1E4D7A] whitespace-nowrap">Bilet №</th>
                <th className="py-2.5 px-4 text-left border border-[#1E4D7A] whitespace-nowrap">Oxucu Adı Soyadı</th>
                <th className="py-2.5 px-4 text-left border border-[#1E4D7A] whitespace-nowrap">Statusu / Qrupu</th>
                <th className="py-2.5 px-4 text-left border border-[#1E4D7A] whitespace-nowrap">Götürdüyü Kitab</th>
                <th className="py-2.5 px-3 text-center border border-[#1E4D7A] whitespace-nowrap">Verilmə T.</th>
                <th className="py-2.5 px-3 text-center border border-[#1E4D7A] whitespace-nowrap">Qaytarılmalı T.</th>
                <th className="py-2.5 px-3 text-center border border-[#1E4D7A] whitespace-nowrap">Gecikmə</th>
              </tr>
            </thead>
            <tbody className="bg-white text-slate-900 text-[11px] sm:text-xs">
              {delinquentLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium border border-slate-300">
                    Hazırda borclu və ya gecikdirən oxucu qeydə alınmayıb.
                  </td>
                </tr>
              ) : (
                delinquentLoans.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-semibold border border-slate-300 whitespace-nowrap">
                      {item.ticketNumber}
                    </td>
                    <td className="py-2 px-4 text-left font-medium border border-slate-300 whitespace-nowrap">
                      {item.readerName}
                    </td>
                    <td className="py-2 px-4 text-left border border-slate-300">
                      {item.statusInfo}
                    </td>
                    <td className="py-2 px-4 text-left font-medium border border-slate-300">
                      {item.bookWithInv}
                    </td>
                    <td className="py-2 px-3 text-center font-mono border border-slate-300 whitespace-nowrap">
                      {formatDateAz(item.issueDate)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono border border-slate-300 whitespace-nowrap">
                      {item.dueDate === "Tədris ili sonu" ? "Tədris ili sonu" : formatDateAz(item.dueDate)}
                    </td>
                    <td className="py-2 px-3 text-center border border-slate-300 whitespace-nowrap">
                      {item.isOverdue ? (
                        <span className="text-red-600 font-bold">{item.delayStatus}</span>
                      ) : (
                        <span className="text-slate-600">{item.delayStatus}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 4. RƏSMİ İMZA SAHƏLƏRİ ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 text-white text-xs sm:text-sm font-medium print:text-slate-900 print:pt-12">
        <div className="flex items-center gap-2">
          <span>Hesabatı hazırladı / Kitabxana məsulu:</span>
          <span className="inline-block border-b border-white print:border-slate-800 min-w-[200px] sm:min-w-[260px]">&nbsp;</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Təsdiq etdi / Rəhbərlik:</span>
          <span className="inline-block border-b border-white print:border-slate-800 min-w-[200px] sm:min-w-[260px]">&nbsp;</span>
        </div>
      </div>
    </div>
  );
}
