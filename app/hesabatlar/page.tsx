"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Printer,
  FileText,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  AlertTriangle,
  Layers,
  ShieldAlert,
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

type PeriodPreset = "academic" | "month" | "week" | "today" | "all" | "custom";

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

  // Time Period Filter: default "academic" (from 01.09 of current academic year to today)
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

    // Default academic start date: September 1st of current academic year
    const now = new Date();
    const currentYear = now.getFullYear();
    const academicStartYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
    const academicStart = `${academicStartYear}-09-01`;

    setStartDate(academicStart);
    setEndDate(todayStr);

    const handleUpdate = () => fetchData();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, [todayStr]);

  // Calculate Date Bounds based on Preset
  const { filterStart, filterEnd } = useMemo(() => {
    const now = new Date();
    let s = new Date(2000, 0, 1);
    const e = new Date();

    const currentYear = now.getFullYear();
    const academicStartYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;

    if (period === "all") {
      return { filterStart: "2000-01-01", filterEnd: todayStr };
    } else if (period === "academic") {
      return {
        filterStart: `${academicStartYear}-09-01`,
        filterEnd: todayStr,
      };
    } else if (period === "today") {
      s = now;
    } else if (period === "week") {
      s.setDate(now.getDate() - 7);
    } else if (period === "month") {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "custom") {
      const sDate = startDate || `${academicStartYear}-09-01`;
      const eDate = endDate || todayStr;
      return {
        filterStart: sDate <= eDate ? sDate : eDate,
        filterEnd: sDate <= eDate ? eDate : sDate,
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
    // 1. Cəmi Kitab Fondu: Total physical copies
    const totalCopies = copies.length > 0
      ? copies.length
      : books.reduce((acc, b) => acc + (b.copiesCount || 0), 0);

    // 2. Fondda (Rəfdə): status is 'Fondda' or 'Mövcuddur' and not currently loaned out
    const inLibrary = copies.length > 0
      ? copies.filter((c) => c.status === "Fondda" || (c.status as string) === "Mövcuddur").length
      : books.reduce((acc, b) => acc + (b.availableCount ?? b.copiesCount ?? 0), 0);

    // 3. Oxucuda: Total active loans
    const inUse = activeLoans.length;

    // 4. Vaxtı Keçmiş (Gecikən): dueDate < todayStr
    const overdue = overdueLoans.length;

    // 5. Yeni Gələn Kitablar: Copies or books registered within filter period
    const newlyAddedCopies = copies.filter((c) => c.addedDate && c.addedDate >= filterStart).length ||
      books.filter((b) => b.createdAt && b.createdAt >= filterStart).reduce((acc, b) => acc + (b.copiesCount || 1), 0);

    // 6. Müəllim Oxucular: Registered teacher readers
    const teacherReaders = readers.filter(
      (r) => r.category === "Müəllim" || r.role === "teacher"
    ).length;

    // 7. Tələbə Oxucular: Registered student readers
    const studentReaders = readers.filter(
      (r) => r.category === "Tələbə" || r.role === "student" || (!r.category && !r.role)
    ).length;

    // Elektron Resurslar: total in /e-kitabxana collection
    const eResources = digitalResources.length;

    // Ümumi Aktiv Oxucu Sayı
    const activeReaders = readers.filter(
      (r) => r.status === "active" || r.status === "Aktiv" || !r.status
    ).length;

    return {
      totalCopies,
      inLibrary,
      inUse,
      overdue,
      newlyAddedCopies,
      teacherReaders,
      studentReaders,
      eResources,
      activeReaders,
    };
  }, [copies, books, activeLoans, overdueLoans, digitalResources, readers, filterStart]);

  // ================= 2. CIRCULATION RECORDS FOR A4 REPORT TABLE =================
  const circulationRecords = useMemo(() => {
    // Filter loans matching the selected date period
    const filtered = loans.filter((l) => {
      if (!l.issueDate) return true;
      if (period === "all") return true;
      return l.issueDate >= filterStart && l.issueDate <= filterEnd;
    });

    return filtered.map((l) => {
      const isReturned = Boolean(l.returnDate) || l.status === "Qaytarılıb";
      const isOverdue = !isReturned && l.dueDate && l.dueDate < todayStr;

      let status = "Götürülüb (İstifadədə)";
      if (isReturned) {
        status = "Qaytarılıb";
      } else if (isOverdue) {
        const dueTime = new Date(l.dueDate).getTime();
        const nowTime = new Date(todayStr).getTime();
        const days = Math.max(1, Math.round((nowTime - dueTime) / (1000 * 60 * 60 * 24)));
        status = `Gecikir (${days} gün)`;
      }

      const book = books.find((b) => b.id === l.bookId);
      const copy = copies.find((c) => c.id === l.copyId || c.inventoryNumber === l.inventoryNumber);

      const invNo = l.inventoryNumber || copy?.inventoryNumber || (l.bookId ? `INV-${l.bookId.slice(-5)}` : "INV-1001");
      const author = l.bookAuthor || book?.author || "—";

      return {
        id: l.id,
        inventoryNumber: invNo,
        title: l.bookTitle,
        author,
        readerName: l.readerName,
        issueDate: formatDateAz(l.issueDate),
        returnDate: l.returnDate ? formatDateAz(l.returnDate) : "—",
        status,
      };
    });
  }, [loans, period, filterStart, filterEnd, todayStr, books, copies]);

  // ================= 3. ESAS CƏDVƏL (INTERAKTIV PANEL ÜÇÜN) =================
  const booksReport = useMemo(() => {
    return books.map((b) => {
      const bookCopies = copies.filter((c) => c.bookId === b.id);
      const totalCount = bookCopies.length > 0 ? bookCopies.length : (b.copiesCount || 0);

      const inLibraryCount = bookCopies.length > 0
        ? bookCopies.filter((c) => c.status === "Fondda" || (c.status as string) === "Mövcuddur").length
        : (b.availableCount ?? totalCount);

      const bookActiveLoans = activeLoans.filter((l) => l.bookId === b.id);
      const inUseCount = bookActiveLoans.length;
      const overdueCount = bookActiveLoans.filter((l) => l.dueDate < todayStr).length;

      const primaryInventory = bookCopies[0]?.inventoryNumber || b.isbn || `INV-${b.id.slice(-4)}`;
      const condition = bookCopies[0]?.condition || "Yaxşı";
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

  // Borclu və Gecikdirən Oxucular
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

  // Top Active Readers
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

  // Top Borrowed Books
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

  // ================= 4. REAL DATABASE MICROSOFT WORD EXPORT (.doc) =================
  // Clean export without ANY table gridlines around signatures!
  const handleExportWord = () => {
    const tableRowsHtml = circulationRecords.length === 0
      ? `<tr><td colspan="7" style="border: 1pt solid #000000; padding: 6pt; text-align: center; font-size: 10pt;">Seçilmiş hesabat dövrü üzrə heç bir kitab dövriyyəsi qeydə alınmayıb.</td></tr>`
      : circulationRecords.map((item) => `
        <tr>
          <td style="border: 1pt solid #000000; padding: 5pt 6pt; text-align: center; font-family: monospace; font-size: 9.5pt;">${item.inventoryNumber}</td>
          <td style="border: 1pt solid #000000; padding: 5pt 6pt; text-align: center; font-size: 10pt; font-weight: bold;">${item.title}</td>
          <td style="border: 1pt solid #000000; padding: 5pt 6pt; text-align: center; font-size: 10pt;">${item.author}</td>
          <td style="border: 1pt solid #000000; padding: 5pt 6pt; text-align: center; font-size: 10pt;">${item.readerName}</td>
          <td style="border: 1pt solid #000000; padding: 5pt 6pt; text-align: center; font-size: 10pt;">${item.issueDate}</td>
          <td style="border: 1pt solid #000000; padding: 5pt 6pt; text-align: center; font-size: 10pt;">${item.returnDate}</td>
          <td style="border: 1pt solid #000000; padding: 5pt 6pt; text-align: center; font-size: 10pt; white-space: nowrap;">${item.status}</td>
        </tr>
      `).join("");

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Kitabxana Dövriyyə Hesabatı</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 Portrait */
            margin: 42.5pt 42.5pt 42.5pt 42.5pt; /* 15mm */
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            color: #000000;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          p, h1, h2, h3 {
            margin: 0;
            padding: 0;
          }
          table.report-table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 14pt;
          }
          table.report-table th {
            border: 1pt solid #000000;
            padding: 5pt 6pt;
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
            background-color: #ffffff;
          }
          table.report-table td {
            border: 1pt solid #000000;
            padding: 5pt 6pt;
            font-size: 9.5pt;
          }
          table.summary-box {
            border: 1pt solid #000000;
            border-collapse: collapse;
            width: 100%;
            margin-top: 16pt;
          }
          table.summary-box td {
            border: 1pt solid #000000;
            padding: 8pt 12pt;
            vertical-align: top;
            font-size: 10.5pt;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div style="text-align: center;">
            <p style="font-size: 11pt; font-weight: bold; letter-spacing: 1pt; text-transform: uppercase;">AZƏRBAYCAN RESPUBLİKASI ELM VƏ TƏHSİL NAZİRLİYİ</p>
            <p style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 3pt;">LƏNKƏRAN DÖVLƏT PEŞƏ TƏHSİL MƏRKƏZİ</p>
            <div style="border-bottom: 2pt solid #000000; margin: 10pt 0;"></div>
            <p style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-top: 8pt;">KİTABXANA DÖVRİYYƏ HESABATI</p>
            <p style="font-size: 11pt; font-weight: bold; margin-top: 3pt;">(${formatDateAz(filterStart)} – ${formatDateAz(filterEnd)}-cı il tarixləri üzrə)</p>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 12%;">İnventar №</th>
                <th style="width: 22%;">Nəşrin Adı</th>
                <th style="width: 14%;">Müəllif</th>
                <th style="width: 18%;">Oxucu Adı Soyadı</th>
                <th style="width: 11%;">Verilmə Tarixi</th>
                <th style="width: 11%;">Qaytarılma Tarixi</th>
                <th style="width: 12%;">Statusu</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <table class="summary-box">
            <tr>
              <td style="width: 50%;">
                <p style="margin-bottom: 4pt;">• <b>Cəmi Kitab Fondu:</b> ${summaryStats.totalCopies.toLocaleString("az-AZ")} nüsxə</p>
                <p style="margin-bottom: 4pt;">• <b>Fondda (Rəfdə):</b> ${summaryStats.inLibrary.toLocaleString("az-AZ")} nüsxə</p>
                <p style="margin-bottom: 4pt;">• <b>Oxucuda:</b> ${summaryStats.inUse.toLocaleString("az-AZ")} nüsxə</p>
                <p>• <b>Vaxtı Keçmiş (Gecikən):</b> ${summaryStats.overdue.toLocaleString("az-AZ")} nüsxə</p>
              </td>
              <td style="width: 50%;">
                <p style="margin-bottom: 4pt;">• <b>Yeni Gələn Kitablar:</b> ${summaryStats.newlyAddedCopies.toLocaleString("az-AZ")} nüsxə</p>
                <p style="margin-bottom: 4pt;">• <b>Müəllim Oxucular:</b> ${summaryStats.teacherReaders.toLocaleString("az-AZ")} nəfər</p>
                <p>• <b>Tələbə Oxucular:</b> ${summaryStats.studentReaders.toLocaleString("az-AZ")} nəfər</p>
              </td>
            </tr>
          </table>

          <!-- CLEAN SIGNATURES: PURE PARAGRAPH WITH NO TABLE GRIDLINES -->
          <p style="margin-top: 36pt; font-size: 11pt; tab-stops: right 510pt;">
            <span>Kitabxana məsulu: ___________________</span>
            <span style="float: right; text-align: right;">&#9;Təsdiq etdi / Rəhbərlik: ___________________</span>
          </p>

          <p style="margin-top: 24pt; font-size: 11pt;">
            Tarix: ${formatDateAz(todayStr)}
          </p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", wordContent], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Kitabxana_Dovriyye_Hesabati_${todayStr}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger Print Dialog
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-0">
      {/* Strict Print CSS for Pure White A4 Portrait with 15mm Margins */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              html, body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: "Times New Roman", Times, Georgia, serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              .print-document-container {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
            }
          `,
        }}
      />

      {/* 1. Header (Screen Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Hesabatlar və Statistika
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lənkəran Dövlət Peşə Təhsil Mərkəzi — kitab fondu və canlı dövriyyə göstəriciləri
          </p>
        </div>

        {/* Action Buttons: Export Word (.doc) & Print / Save PDF */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportWord}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Microsoft Word sənədi (.doc) kimi rəsmi hesabatı yüklə"
          >
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Word kimi saxla (.doc)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-slate-900 active:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="A4 formatında rəsmi sənədi çap et və ya PDF kimi yadda saxla"
          >
            <Printer className="w-4 h-4" />
            <span>Çap et / PDF kimi yadda saxla</span>
          </button>
        </div>
      </div>

      {/* 2. Filtrlər Paneli (Screen Only) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Hesabat Dövrü:
          </span>

          {/* Period Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setPeriod("academic")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "academic"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Akademik İl (01.09-dan)
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "month"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Cari Ay
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "week"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Son 7 gün
            </button>
            <button
              onClick={() => setPeriod("today")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "today"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bu gün
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bütün dövr
            </button>
            <button
              onClick={() => setPeriod("custom")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                period === "custom"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Fərdi aralıq
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Başlanğıc:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Son:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-600"
              />
            </div>
            <span className="text-[11px] text-slate-400">
              Seçilmiş aralıq: {formatDateAz(filterStart)} — {formatDateAz(filterEnd)}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE DASHBOARD VIEW (Always directly visible on screen)         */}
      {/* ========================================================================= */}
      <div className="space-y-6 print:hidden">
        {/* Real-time Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Kitab Fondu</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{summaryStats.totalCopies}</span>
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
              <span className="text-2xl font-black text-emerald-700">{summaryStats.inLibrary}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Mövcud olanlar</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Oxucuda</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-blue-700">{summaryStats.inUse}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Aktiv istiqrazda</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Gecikən</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-rose-700">{summaryStats.overdue}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Vaxtı keçmiş</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Elektron Resurs</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-purple-700">{summaryStats.eResources}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">PDF / e-kitablar</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Aktiv Oxucu</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{summaryStats.activeReaders}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Təsdiqlənmiş oxucular</p>
            </div>
          </div>
        </div>

        {/* Interactive Books Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Əsas Kitab Fondu və Dövriyyə Cədvəli
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bazada qeydiyyatda olan bütün nəşrlər, nüsxə sayları və real dövriyyə göstəriciləri
              </p>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder="Kitab, müəllif və ya inventar axtar..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-indigo-600 w-56 sm:w-64"
                />
              </div>

              <select
                value={selectedBookCategory}
                onChange={(e) => setSelectedBookCategory(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-indigo-600 text-slate-700"
              >
                <option value="all">Bütün Bölmələr</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredBooksReport.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Axtarışa uyğun kitab tapılmadı.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">№ / İnventar</th>
                    <th className="py-2.5 px-3">Nəşrin Adı & Müəllif</th>
                    <th className="py-2.5 px-3">İxtisas / Bölmə</th>
                    <th className="py-2.5 px-3">Dil / İl</th>
                    <th className="py-2.5 px-3">Rəf Ünvanı</th>
                    <th className="py-2.5 px-3 text-center">Cəmi</th>
                    <th className="py-2.5 px-3 text-center">Fondda</th>
                    <th className="py-2.5 px-3 text-center">Oxucuda</th>
                    <th className="py-2.5 px-3 text-center">Gecikən</th>
                    <th className="py-2.5 px-3 text-center">Vəziyyəti</th>
                    <th className="py-2.5 px-3 text-right">Ümumi Verilmə</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBooksReport.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {b.inventoryNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{b.title}</div>
                        <div className="text-[11px] text-slate-500">{b.author}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {b.language} {b.year !== "—" ? `• ${b.year}` : ""}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {b.shelf}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{b.total}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{b.inLibrary}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-600">{b.inUse}</td>
                      <td className="py-2.5 px-3 text-center">
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

        {/* Delinquent Readers Table */}
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

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>

      {/* ========================================================================= */}
      {/* 4. OFFICIAL A4 REPORT DOCUMENT (FOR WINDOW.PRINT ONLY)                     */}
      {/* Strictly hidden on screen, prints as pure white A4 on window.print()       */}
      {/* ========================================================================= */}
      <div
        className="print-document-container hidden print:block bg-white text-black font-['Times_New_Roman',Times,Georgia,serif] leading-normal"
      >
        {/* HEADER SECTION */}
        <div className="text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-black">
            AZƏRBAYCAN RESPUBLİKASI ELM VƏ TƏHSİL NAZİRLİYİ
          </p>
          <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-black mt-1">
            LƏNKƏRAN DÖVLƏT PEŞƏ TƏHSİL MƏRKƏZİ
          </h2>

          {/* Full-width solid black line (2px solid #000) */}
          <div className="w-full border-b-2 border-black my-4" />

          {/* Report Title & Period Subtitle */}
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-bold tracking-wider uppercase text-black">
              KİTABXANA DÖVRİYYƏ HESABATI
            </h1>
            <p className="text-xs sm:text-sm font-bold text-black">
              ({formatDateAz(filterStart)} – {formatDateAz(filterEnd)}-cı il tarixləri üzrə)
            </p>
          </div>
        </div>

        {/* CIRCULATION TABLE (7 Columns with 1px solid #000 borders) */}
        <div className="mt-6">
          <table className="w-full border-collapse border border-black text-black text-xs sm:text-sm">
            <thead>
              <tr className="bg-white">
                <th className="border border-black p-2 font-bold text-center w-[12%]">
                  İnventar №
                </th>
                <th className="border border-black p-2 font-bold text-center w-[22%]">
                  Nəşrin Adı
                </th>
                <th className="border border-black p-2 font-bold text-center w-[14%]">
                  Müəllif
                </th>
                <th className="border border-black p-2 font-bold text-center w-[18%]">
                  Oxucu Adı Soyadı
                </th>
                <th className="border border-black p-2 font-bold text-center w-[11%]">
                  Verilmə Tarixi
                </th>
                <th className="border border-black p-2 font-bold text-center w-[11%]">
                  Qaytarılma Tarixi
                </th>
                <th className="border border-black p-2 font-bold text-center w-[12%]">
                  Statusu
                </th>
              </tr>
            </thead>
            <tbody>
              {circulationRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-black p-4 text-center font-medium text-slate-600">
                    Seçilmiş hesabat dövrü üzrə heç bir kitab dövriyyəsi qeydə alınmayıb.
                  </td>
                </tr>
              ) : (
                circulationRecords.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="border border-black p-1.5 sm:p-2 text-center font-mono text-xs sm:text-sm">
                      {item.inventoryNumber}
                    </td>
                    <td className="border border-black p-1.5 sm:p-2 text-center text-xs sm:text-sm font-medium">
                      {item.title}
                    </td>
                    <td className="border border-black p-1.5 sm:p-2 text-center text-xs sm:text-sm">
                      {item.author}
                    </td>
                    <td className="border border-black p-1.5 sm:p-2 text-center text-xs sm:text-sm">
                      {item.readerName}
                    </td>
                    <td className="border border-black p-1.5 sm:p-2 text-center text-xs sm:text-sm">
                      {item.issueDate}
                    </td>
                    <td className="border border-black p-1.5 sm:p-2 text-center text-xs sm:text-sm">
                      {item.returnDate}
                    </td>
                    <td className="border border-black p-1.5 sm:p-2 text-center text-xs sm:text-sm whitespace-nowrap">
                      {item.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TWO-COLUMN BORDERED SUMMARY BOX (Below table, 1px solid #000 border) */}
        <div className="border border-black rounded-lg mt-6 overflow-hidden bg-white text-black text-xs sm:text-sm">
          <div className="flex flex-row">
            {/* Left Column */}
            <div className="flex-1 p-3.5 sm:p-4 border-r border-black space-y-1.5">
              <p className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Cəmi Kitab Fondu:</span>
                <span className="font-semibold">{summaryStats.totalCopies.toLocaleString("az-AZ")} nüsxə</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Fondda (Rəfdə):</span>
                <span className="font-semibold">{summaryStats.inLibrary.toLocaleString("az-AZ")} nüsxə</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Oxucuda:</span>
                <span className="font-semibold">{summaryStats.inUse.toLocaleString("az-AZ")} nüsxə</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Vaxtı Keçmiş (Gecikən):</span>
                <span className="font-semibold">{summaryStats.overdue.toLocaleString("az-AZ")} nüsxə</span>
              </p>
            </div>

            {/* Right Column */}
            <div className="flex-1 p-3.5 sm:p-4 space-y-1.5">
              <p className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Yeni Gələn Kitablar:</span>
                <span className="font-semibold">{summaryStats.newlyAddedCopies.toLocaleString("az-AZ")} nüsxə</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Müəllim Oxucular:</span>
                <span className="font-semibold">{summaryStats.teacherReaders.toLocaleString("az-AZ")} nəfər</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="font-bold">•</span>
                <span>Tələbə Oxucular:</span>
                <span className="font-semibold">{summaryStats.studentReaders.toLocaleString("az-AZ")} nəfər</span>
              </p>
            </div>
          </div>
        </div>

        {/* CLEAN SIGNATURE & DATE FOOTER (NO stamp, NO table gridlines) */}
        <div className="mt-10 sm:mt-12 pt-4 flex items-center justify-between text-xs sm:text-sm font-medium text-black">
          <div>
            <span>Kitabxana məsulu: ___________________</span>
          </div>
          <div>
            <span>Təsdiq etdi / Rəhbərlik: ___________________</span>
          </div>
        </div>

        <div className="mt-6 text-xs sm:text-sm font-medium text-black">
          <span>Tarix: {formatDateAz(todayStr)}</span>
        </div>
      </div>
    </div>
  );
}
