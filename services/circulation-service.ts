/**
 * Peşə Kitabxanası - Oxucu və Dövriyyə Servisi (Phase 4)
 * 
 * Bu xidmət oxucuların qeydiyyatı, kitabların verilməsi (Loan issue),
 * kitabların qaytarılması (Loan return) və rezervasiyaların idarə olunmasını təmin edir.
 * Real vəziyyət localStorage üzərindən saxlanılır və Supabase üçün tam hazırdır.
 */

import { getCopies, updateCopy, getBooks, getBookById } from "./books-service";
import { db } from "@/lib/firebase/client";
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

export type ReaderCategory = "Tələbə" | "Müəllim" | "Əməkdaş";
export type ReaderRole = "student" | "teacher" | "staff";
export type UserAccessRole = "reader" | "librarian";
export type ReaderStatus = "pending" | "active" | "blocked" | "Aktiv" | "Borclu" | "Bloklanıb";
export type LoanStatus = "Aktiv" | "Qaytarılıb" | "Gecikib";
export type ReservationStatus = "Gözləyir" | "Nüsxə ayrıldı" | "Ləğv edildi" | "Tamamlandı";

export interface Reader {
  id: string;
  ticketNumber: string; // Məs: OX-1045 (unikal)
  firstName: string;
  lastName: string;
  fatherName?: string;
  category: ReaderCategory;
  role?: ReaderRole; // 'student' | 'teacher' | 'staff'
  accessRole?: UserAccessRole; // 'reader' | 'librarian'
  department: string; // Qrup / Kafedra / Şöbə
  specialty?: string; // İxtisas (for students, e.g. "Kompüter sistemlərində proqramlaşdırma")
  courseYear?: string; // Kurs (for students, e.g. "1-ci kurs", "2-ci kurs")
  position?: string; // Vəzifə / Fənn (for teachers, e.g. "İxtisas fənn müəllimi")
  phone: string;
  email: string; // unikal
  password?: string; // Heşlənmiş təhlükəsiz şifrə (Auth)
  maxBookLimit: number;
  status: ReaderStatus;
  registeredDate: string;
  notes?: string;
}

export function mapCategoryToRole(category: ReaderCategory): ReaderRole {
  if (category === "Müəllim") return "teacher";
  if (category === "Əməkdaş") return "staff";
  return "student";
}

export function isReaderPending(status: ReaderStatus | string): boolean {
  return status === "pending" || status === "Təsdiq gözləyir";
}

export function isReaderActive(status: ReaderStatus | string): boolean {
  return status === "active" || status === "Aktiv";
}

export function isReaderBlocked(status: ReaderStatus | string): boolean {
  return status === "blocked" || status === "Bloklanıb";
}

export interface Loan {
  id: string;
  readerId: string;
  readerName: string;
  readerTicket: string;
  readerRole?: ReaderRole;
  readerCategory?: ReaderCategory;
  specialty?: string;
  courseYear?: string;
  position?: string;
  readerTypeSnapshot?: string; // e.g. "Tələbə • Kompüter sistemləri (2-ci kurs)" or "Müəllim • İxtisas fənn müəllimi"
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

function cleanData<T extends Record<string, any>>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

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
  const { readers, loans, reservations } = loadCirculationData();
  try {
    const snap = await getDocs(collection(db, "readers"));
    if (!snap.empty) {
      const remoteReaders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reader));
      saveCirculationData(remoteReaders, loans, reservations);
      return remoteReaders;
    } else if (readers.length > 0) {
      // Sync local readers to Firestore if collection is empty
      for (const r of readers) {
        setDoc(doc(db, "readers", r.id), cleanData(r), { merge: true }).catch((e) =>
          console.warn("Firestore reader auto-sync warning:", e)
        );
      }
    }
  } catch (err) {
    console.warn("Firestore readers fetch warning:", err);
  }
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
  const role = input.role || mapCategoryToRole(input.category || "Tələbə");
  const accessRole = input.accessRole || "reader";
  const status = input.status || "active";

  const newReader: Reader = {
    ...input,
    ticketNumber: finalTicket,
    role,
    accessRole,
    status,
    id: readerId,
    registeredDate: now,
  };

  const updatedReaders = [newReader, ...readers];
  saveCirculationData(updatedReaders, loans, reservations);

  // Firestore sync
  try {
    await setDoc(doc(db, "readers", readerId), cleanData(newReader), { merge: true });
  } catch (err) {
    console.warn("Firestore reader save warning:", err);
  }

  return newReader;
}

export async function approveReader(id: string): Promise<Reader> {
  return updateReader(id, { status: "active" });
}

export async function updateReader(id: string, updates: Partial<Reader>): Promise<Reader> {
  const { readers, loans, reservations } = loadCirculationData();
  const index = readers.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Oxucu tapılmadı");

  const updatedReader = { ...readers[index], ...updates };
  readers[index] = updatedReader;
  saveCirculationData(readers, loans, reservations);

  // Firestore sync
  try {
    await setDoc(doc(db, "readers", id), cleanData(updatedReader), { merge: true });
  } catch (err) {
    console.warn("Firestore reader update warning:", err);
  }

  return updatedReader;
}

export async function deleteReader(id: string): Promise<void> {
  const { readers, loans, reservations } = loadCirculationData();
  const updated = readers.filter((r) => r.id !== id);
  saveCirculationData(updated, loans, reservations);

  // Firestore sync
  try {
    deleteDoc(doc(db, "readers", id)).catch(() => {});
  } catch {}
}

// ------------------- KİTAB VERİLMƏSİ (LOANS) ------------------- //

export async function getLoans(filter?: { status?: LoanStatus; readerId?: string }): Promise<Loan[]> {
  const { readers, loans, reservations } = loadCirculationData();
  let currentLoans = loans;

  try {
    const snap = await getDocs(collection(db, "loans"));
    if (!snap.empty) {
      currentLoans = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Loan));
      saveCirculationData(readers, currentLoans, reservations);
    } else if (loans.length > 0) {
      // Sync local loans to Firestore if collection is empty
      for (const l of loans) {
        setDoc(doc(db, "loans", l.id), cleanData(l), { merge: true }).catch((e) =>
          console.warn("Firestore loan auto-sync warning:", e)
        );
      }
    }
  } catch (err) {
    console.warn("Firestore loans fetch warning:", err);
  }

  const today = new Date().toISOString().split("T")[0];

  // Gecikmiş olanları dinamik hesablamaq
  const updatedLoans = currentLoans.map((l) => {
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
  // Reader Academic / Staff details captured at lending time (Requirement 1 & 2):
  readerType?: "Tələbə" | "Müəllim";
  specialty?: string; // İxtisas (for students)
  courseYear?: string; // Kurs (for students)
  position?: string; // Vəzifə / Fənn (for teachers)
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

  // Determine reader type details
  const readerType: ReaderCategory =
    input.readerType || (reader.category === "Müəllim" ? "Müəllim" : "Tələbə");
  const readerRole: ReaderRole = readerType === "Müəllim" ? "teacher" : "student";
  const specialty = readerType === "Tələbə" ? (input.specialty?.trim() || reader.specialty) : undefined;
  const courseYear = readerType === "Tələbə" ? (input.courseYear?.trim() || reader.courseYear) : undefined;
  const position = readerType === "Müəllim" ? (input.position?.trim() || reader.position) : undefined;

  const readerTypeSnapshot =
    readerType === "Müəllim"
      ? `Müəllim${position ? ` • ${position}` : ""}`
      : `Tələbə${specialty ? ` • ${specialty}` : ""}${courseYear ? ` (${courseYear})` : ""}`;

  // Update Reader profile so it stays saved for future visits (Requirement 3)
  const readerIdx = readers.findIndex((r) => r.id === reader.id);
  if (readerIdx !== -1) {
    readers[readerIdx] = {
      ...readers[readerIdx],
      category: readerType,
      role: readerRole,
      specialty: specialty !== undefined ? specialty : readers[readerIdx].specialty,
      courseYear: courseYear !== undefined ? courseYear : readers[readerIdx].courseYear,
      position: position !== undefined ? position : readers[readerIdx].position,
    };
  }

  const loanId = `loan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newLoan: Loan = {
    id: loanId,
    readerId: reader.id,
    readerName: `${reader.firstName} ${reader.lastName}`,
    readerTicket: reader.ticketNumber,
    readerRole,
    readerCategory: readerType,
    specialty,
    courseYear,
    position,
    readerTypeSnapshot,
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

  // Firestore sync
  try {
    await setDoc(doc(db, "loans", loanId), cleanData(newLoan), { merge: true });
  } catch (err) {
    console.warn("Firestore loan issue warning:", err);
  }

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

  // Firestore sync
  try {
    await setDoc(doc(db, "loans", loan.id), cleanData(updatedLoan), { merge: true });
  } catch (err) {
    console.warn("Firestore loan return warning:", err);
  }

  return updatedLoan;
}

// ------------------- REZERVASIYALAR (RESERVATIONS) ------------------- //

export async function getReservations(): Promise<Reservation[]> {
  const { readers, loans, reservations } = loadCirculationData();
  try {
    const snap = await getDocs(collection(db, "reservations"));
    if (!snap.empty) {
      const remoteRes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation));
      saveCirculationData(readers, loans, remoteRes);
      return remoteRes;
    } else if (reservations.length > 0) {
      for (const res of reservations) {
        setDoc(doc(db, "reservations", res.id), cleanData(res), { merge: true }).catch((e) =>
          console.warn("Firestore reservation auto-sync warning:", e)
        );
      }
    }
  } catch (err) {
    console.warn("Firestore reservations fetch warning:", err);
  }
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

  // Firestore sync
  try {
    await setDoc(doc(db, "reservations", resId), cleanData(newRes), { merge: true });
  } catch (err) {
    console.warn("Firestore reservation save warning:", err);
  }

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

