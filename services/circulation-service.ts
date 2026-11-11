/**
 * LIBRA AI - Oxucu və Dövriyyə Servisi (Phase 4)
 * 
 * Bu xidmət oxucuların qeydiyyatı, kitabların verilməsi (Loan issue),
 * kitabların qaytarılması (Loan return) və rezervasiyaların idarə olunmasını təmin edir.
 * Real vəziyyət localStorage üzərindən saxlanılır və Supabase üçün tam hazırdır.
 */

import { getCopies, updateCopy, getBooks, getBookById } from "./books-service";

export type ReaderCategory = "Tələbə" | "Müəllim" | "Əməkdaş";
export type ReaderStatus = "Aktiv" | "Borclu" | "Bloklanıb";
export type LoanStatus = "Aktiv" | "Qaytarılıb" | "Gecikib";
export type ReservationStatus = "Gözləyir" | "Nüsxə ayrıldı" | "Ləğv edildi" | "Tamamlandı";

export interface Reader {
  id: string;
  ticketNumber: string; // Məs: OX-1001 (unikal)
  firstName: string;
  lastName: string;
  fatherName?: string;
  category: ReaderCategory;
  department: string; // Qrup / Kafedra / Şöbə
  phone: string;
  email: string; // unikal
  password?: string; // Heşlənmiş təhlükəsiz şifrə (Auth)
  maxBookLimit: number;
  status: ReaderStatus;
  registeredDate: string;
  notes?: string;
}

export interface Loan {
  id: string;
  readerId: string;
  readerName: string;
  readerTicket: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  copyId: string;
  inventoryNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  returnDate?: string;
  status: LoanStatus;
  conditionAtIssue: string;
  conditionAtReturn?: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  readerId: string;
  readerName: string;
  readerTicket: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  reservedDate: string;
  queuePosition: number;
  status: ReservationStatus;
  assignedCopyId?: string;
  assignedInventoryNumber?: string;
}

const STORAGE_KEY_READERS = "libra_ai_readers_v1";
const STORAGE_KEY_LOANS = "libra_ai_loans_v1";
const STORAGE_KEY_RESERVATIONS = "libra_ai_reservations_v1";

let inMemoryReaders: Reader[] = [];
let inMemoryLoans: Loan[] = [];
let inMemoryReservations: Reservation[] = [];

function isClient(): boolean {
  return typeof window !== "undefined";
}

function loadCirculationData(): {
  readers: Reader[];
  loans: Loan[];
  reservations: Reservation[];
} {
  if (!isClient()) {
    return {
      readers: inMemoryReaders,
      loans: inMemoryLoans,
      reservations: inMemoryReservations,
    };
  }
  try {
    const rawR = localStorage.getItem(STORAGE_KEY_READERS);
    const rawL = localStorage.getItem(STORAGE_KEY_LOANS);
    const rawRes = localStorage.getItem(STORAGE_KEY_RESERVATIONS);

    const readers: Reader[] = rawR ? JSON.parse(rawR) : [];
    const loans: Loan[] = rawL ? JSON.parse(rawL) : [];
    const reservations: Reservation[] = rawRes ? JSON.parse(rawRes) : [];

    inMemoryReaders = readers;
    inMemoryLoans = loans;
    inMemoryReservations = reservations;

    return { readers, loans, reservations };
  } catch (err) {
    console.error("Dövriyyə məlumatları oxunarkən xəta:", err);
    return {
      readers: inMemoryReaders,
      loans: inMemoryLoans,
      reservations: inMemoryReservations,
    };
  }
}

function saveCirculationData(
  readers: Reader[],
  loans: Loan[],
  reservations: Reservation[]
): void {
  inMemoryReaders = readers;
  inMemoryLoans = loans;
  inMemoryReservations = reservations;
  if (isClient()) {
    try {
      localStorage.setItem(STORAGE_KEY_READERS, JSON.stringify(readers));
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
      localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(reservations));
      window.dispatchEvent(new CustomEvent("libra-data-updated"));
    } catch (err) {
      console.error("Dövriyyə məlumatları saxlanarkən xəta:", err);
    }
  }
}

// ------------------- OXUCULAR (READERS) ------------------- //

export async function getReaders(): Promise<Reader[]> {
  const { readers } = loadCirculationData();
  return [...readers];
}

export async function getReaderById(id: string): Promise<Reader | null> {
  const { readers } = loadCirculationData();
  return readers.find((r) => r.id === id) || null;
}

export async function getReaderByEmail(email: string): Promise<Reader | null> {
  const { readers } = loadCirculationData();
  const normalized = email.trim().toLowerCase();
  return readers.find((r) => r.email?.trim().toLowerCase() === normalized) || null;
}

export async function getReaderByTicketNumber(ticketNumber: string): Promise<Reader | null> {
  const { readers } = loadCirculationData();
  const normalized = ticketNumber.trim().toUpperCase();
  return readers.find((r) => r.ticketNumber?.trim().toUpperCase() === normalized) || null;
}

export async function generateNextTicketNumber(): Promise<string> {
  const { readers } = loadCirculationData();
  let highest = 1000;
  for (const r of readers) {
    const match = r.ticketNumber?.match(/OX-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  }
  let candidate = highest + 1;
  while (readers.some((r) => r.ticketNumber?.toUpperCase() === `OX-${candidate}`)) {
    candidate++;
  }
  return `OX-${candidate}`;
}

export async function createReader(
  input: Omit<Reader, "id" | "registeredDate"> & { ticketNumber?: string }
): Promise<Reader> {
  const { readers, loans, reservations } = loadCirculationData();

  // Validate or auto-generate unique ticket number
  let finalTicket = input.ticketNumber?.trim().toUpperCase();
  if (!finalTicket) {
    finalTicket = await generateNextTicketNumber();
  } else {
    // If ticket number exists, generate next unique
    const isTaken = readers.some((r) => r.ticketNumber?.toUpperCase() === finalTicket);
    if (isTaken) {
      finalTicket = await generateNextTicketNumber();
    }
  }

  const readerId = `r-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString().split("T")[0];

  const newReader: Reader = {
    ...input,
    ticketNumber: finalTicket,
    id: readerId,
    registeredDate: now,
  };

  const updatedReaders = [newReader, ...readers];
  saveCirculationData(updatedReaders, loans, reservations);
  return newReader;
}

export async function updateReader(id: string, updates: Partial<Reader>): Promise<Reader> {
  const { readers, loans, reservations } = loadCirculationData();
  const index = readers.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Oxucu tapılmadı");

  const updatedReader = { ...readers[index], ...updates };
  readers[index] = updatedReader;
  saveCirculationData(readers, loans, reservations);
  return updatedReader;
}

export async function deleteReader(id: string): Promise<void> {
  const { readers, loans, reservations } = loadCirculationData();
  const updated = readers.filter((r) => r.id !== id);
  saveCirculationData(updated, loans, reservations);
}

// ------------------- KİTAB VERİLMƏSİ (LOANS) ------------------- //

export async function getLoans(filter?: { status?: LoanStatus; readerId?: string }): Promise<Loan[]> {
  const { loans } = loadCirculationData();
  const today = new Date().toISOString().split("T")[0];

  // Gecikmiş olanları dinamik hesablamaq
  const updatedLoans = loans.map((l) => {
    if (l.status === "Aktiv" && l.dueDate < today) {
      return { ...l, status: "Gecikib" as LoanStatus };
    }
    return l;
  });

  let result = updatedLoans;
  if (filter?.status) {
    result = result.filter((l) => l.status === filter.status);
  }
  if (filter?.readerId) {
    result = result.filter((l) => l.readerId === filter.readerId);
  }
  return result;
}

export interface IssueBookInput {
  readerId: string;
  copyId: string;
  dueDays?: number;
  customDueDate?: string;
  notes?: string;
}

/**
 * Kitabın oxucuya verilməsi (Loan Issue)
 */
export async function issueBook(input: IssueBookInput): Promise<Loan> {
  const { readers, loans, reservations } = loadCirculationData();
  const reader = readers.find((r) => r.id === input.readerId);
  if (!reader) throw new Error("Oxucu tapılmadı");

  const allCopies = await getCopies();
  const copy = allCopies.find((c) => c.id === input.copyId);
  if (!copy) throw new Error("Nüsxə tapılmadı");
  if (copy.status !== "Fondda") throw new Error("Bu nüsxə hazırda rəfdə deyil (artıq verilib və ya silinib)");

  const today = new Date();
  const issueDateStr = today.toISOString().split("T")[0];

  let dueDateStr = "";
  if (input.customDueDate) {
    dueDateStr = input.customDueDate;
  } else {
    const days = input.dueDays || 14;
    const due = new Date();
    due.setDate(today.getDate() + days);
    dueDateStr = due.toISOString().split("T")[0];
  }

  const loanId = `loan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newLoan: Loan = {
    id: loanId,
    readerId: reader.id,
    readerName: `${reader.firstName} ${reader.lastName}`,
    readerTicket: reader.ticketNumber,
    bookId: copy.bookId,
    bookTitle: copy.bookTitle,
    bookAuthor: copy.bookAuthor,
    copyId: copy.id,
    inventoryNumber: copy.inventoryNumber,
    issueDate: issueDateStr,
    dueDate: dueDateStr,
    status: "Aktiv",
    conditionAtIssue: copy.condition,
    notes: input.notes,
  };

  // Nüsxənin statusunu yeniləyirik
  await updateCopy(copy.id, { status: "Oxucuda" });

  const updatedLoans = [newLoan, ...loans];
  saveCirculationData(readers, updatedLoans, reservations);
  return newLoan;
}

export interface ReturnBookInput {
  loanId: string;
  conditionAtReturn: "Əla" | "Yaxşı" | "Təmirə ehtiyac var" | "Yararsız";
  notes?: string;
}

/**
 * Kitabın fonda geri qəbul edilməsi (Loan Return)
 */
export async function returnBook(input: ReturnBookInput): Promise<Loan> {
  const { readers, loans, reservations } = loadCirculationData();
  const index = loans.findIndex((l) => l.id === input.loanId);
  if (index === -1) throw new Error("İstiqraz qeydi tapılmadı");

  const loan = loans[index];
  const now = new Date().toISOString().split("T")[0];

  const updatedLoan: Loan = {
    ...loan,
    returnDate: now,
    status: "Qaytarılıb",
    conditionAtReturn: input.conditionAtReturn,
    notes: input.notes || loan.notes,
  };
  loans[index] = updatedLoan;

  // Nüsxəni fonda qaytarırıq və fiziki vəziyyətini yeniləyirik
  await updateCopy(loan.copyId, {
    status: "Fondda",
    condition: input.conditionAtReturn,
  });

  saveCirculationData(readers, loans, reservations);
  return updatedLoan;
}

// ------------------- REZERVASIYALAR (RESERVATIONS) ------------------- //

export async function getReservations(): Promise<Reservation[]> {
  const { reservations } = loadCirculationData();
  return [...reservations];
}

export async function createReservation(input: {
  readerId: string;
  bookId: string;
}): Promise<Reservation> {
  const { readers, loans, reservations } = loadCirculationData();
  const reader = readers.find((r) => r.id === input.readerId);
  if (!reader) throw new Error("Oxucu tapılmadı");

  const book = await getBookById(input.bookId);
  if (!book) throw new Error("Kitab tapılmadı");

  // Mövcud növbə sayını hesablamaq
  const existingForBook = reservations.filter(
    (r) => r.bookId === input.bookId && r.status === "Gözləyir"
  );
  const queuePos = existingForBook.length + 1;

  const resId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString().split("T")[0];

  const newRes: Reservation = {
    id: resId,
    readerId: reader.id,
    readerName: `${reader.firstName} ${reader.lastName}`,
    readerTicket: reader.ticketNumber,
    bookId: book.id,
    bookTitle: book.title,
    bookAuthor: book.author,
    reservedDate: now,
    queuePosition: queuePos,
    status: "Gözləyir",
  };

  const updated = [newRes, ...reservations];
  saveCirculationData(readers, loans, updated);
  return newRes;
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  assignedCopy?: { copyId: string; inventoryNumber: string }
): Promise<Reservation> {
  const { readers, loans, reservations } = loadCirculationData();
  const index = reservations.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Rezervasiya tapılmadı");

  const updated: Reservation = {
    ...reservations[index],
    status,
    assignedCopyId: assignedCopy?.copyId,
    assignedInventoryNumber: assignedCopy?.inventoryNumber,
  };
  reservations[index] = updated;
  saveCirculationData(readers, loans, reservations);
  return updated;
}

