/**
 * LIBRA AI - Dashboard Service Layer
 * 
 * Bu xidmət təbəqəsi idarəetmə panelinin statistik məlumatlarını,
 * qrafik göstəricilərini və son əməliyyat loglarını təmin edir.
 * Real vəziyyət (books-service və circulation-service) ilə inteqrasiyalıdır.
 */

import { getBooks, getCopies } from "./books-service";
import { getReaders, getLoans, Loan } from "./circulation-service";

export interface DashboardStats {
  totalTitles: number;       // Ümumi kitab fondu (Unikal başlıqlar)
  totalCopies: number;       // Fiziki nüsxələr
  availableCopies: number;   // Mövcud nüsxələr (Rəfdə olan)
  borrowedCopies: number;    // Verilmiş nüsxələr (Oxucuda olan)
  overdueCopies: number;     // Gecikdirilmiş nüsxələr
  totalReaders: number;      // Qeydiyyatda olan oxucular
}

export interface TurnoverDataPoint {
  period: string;            // Ay və ya dövr
  borrowed: number;          // Verilən kitablar
  returned: number;          // Qaytarılan kitablar
}

export interface CategoryDistribution {
  name: string;              // Kateqoriya adı (Texniki, Bədii, Dərslik və s.)
  count: number;             // Sayı
  color: string;             // Qrafik rəngi
}

export interface OverdueAlert {
  id: string;
  readerName: string;
  readerCard: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue: number;
  status: "gecikib" | "yaxinlasir";
}

export interface RecentActivity {
  id: string;
  readerName: string;
  bookTitle: string;
  inventoryNumber: string;
  action: "verilme" | "qaytarilma";
  timestamp: string;
}

export interface DashboardData {
  stats: DashboardStats;
  turnover: TurnoverDataPoint[];
  categories: CategoryDistribution[];
  overdueAlerts: OverdueAlert[];
  recentActivities: RecentActivity[];
}

export const initialZeroDashboardData: DashboardData = {
  stats: {
    totalTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    borrowedCopies: 0,
    overdueCopies: 0,
    totalReaders: 0,
  },
  turnover: [],
  categories: [],
  overdueAlerts: [],
  recentActivities: [],
};

const CATEGORY_COLORS = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];

/**
 * Dashboard göstəricilərini kitab fondu və əməliyyat bazasından toplayır
 */
export async function getDashboardData(): Promise<DashboardData> {
  const books = await getBooks();
  const copies = await getCopies();
  const readers = await getReaders();
  const loans = await getLoans();

  const totalTitles = books.length;
  const totalCopies = copies.filter((c) => c.status !== "Silinib").length;
  const availableCopies = copies.filter((c) => c.status === "Fondda").length;
  const activeLoans = loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib");
  const borrowedCopies = activeLoans.length;
  const overdueLoans = loans.filter((l) => l.status === "Gecikib");
  const overdueCopies = overdueLoans.length;

  // Kateqoriya bölgüsünü dinamik hesablamaq
  const catCountMap: Record<string, number> = {};
  books.forEach((b) => {
    const cat = b.category || "Digər";
    catCountMap[cat] = (catCountMap[cat] || 0) + b.copiesCount;
  });

  const categories: CategoryDistribution[] = Object.keys(catCountMap).map((catName, idx) => ({
    name: catName,
    count: catCountMap[catName],
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  // Gecikən və ya yaxınlaşan istiqrazlar
  const today = new Date().toISOString().split("T")[0];
  const overdueAlerts: OverdueAlert[] = activeLoans.map((l) => {
    const isOverdue = l.dueDate < today;
    const dueTime = new Date(l.dueDate).getTime();
    const nowTime = new Date(today).getTime();
    const diffDays = Math.max(1, Math.round((nowTime - dueTime) / (1000 * 60 * 60 * 24)));

    return {
      id: l.id,
      readerName: l.readerName,
      readerCard: l.readerTicket,
      bookTitle: l.bookTitle,
      dueDate: l.dueDate,
      daysOverdue: isOverdue ? diffDays : 0,
      status: isOverdue ? "gecikib" : "yaxinlasir",
    };
  });

  // Son əməliyyatlar
  const recentActivities: RecentActivity[] = loans.slice(0, 10).map((l) => ({
    id: l.id,
    readerName: l.readerName,
    bookTitle: l.bookTitle,
    inventoryNumber: l.inventoryNumber,
    action: l.returnDate ? "qaytarilma" : "verilme",
    timestamp: l.returnDate || l.issueDate,
  }));

  return {
    stats: {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies,
      overdueCopies,
      totalReaders: readers.length,
    },
    turnover: [],
    categories,
    overdueAlerts,
    recentActivities,
  };
}
