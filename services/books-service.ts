/**
 * Peşə Kitabxanası - Kitab Fondu və Fiziki Nüsxələr Servisi (Phase 3)
 * 
 * Bu xidmət kitab fondunun və fiziki nüsxələrin idarə edilməsini təmin edir.
 * Müştəri tərəfində reaktiv vəziyyət (localStorage / in-memory) saxlayır və
 * gələcək Supabase/PostgreSQL inteqrasiyasına tam hazır API interfeysinə malikdir.
 * 
 * Qeyd: Heç bir saxta statik mock massiv daxil edilməyib; başlanğıcda təmiz boş vəziyyət (zero state) təmin olunur.
 */

import { db } from "@/lib/firebase/client";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

export type BookLanguage = "Azərbaycan" | "Rus" | "İngilis" | "Türk" | "Digər";

export type CopyCondition = "Əla" | "Yaxşı" | "Təmirə ehtiyac var" | "Yararsız";

export type CopyStatus = "Fondda" | "Oxucuda" | "Silinib" | "İtmiş";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  udk?: string;
  category: string;
  publisher?: string;
  year?: number | string;
  pages?: number;
  language: BookLanguage;
  copiesCount: number;
  availableCount: number;
  initialShelf: string;
  description?: string;
  createdAt: string;
}

export interface BookCopy {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  inventoryNumber: string; // Məs: INV-1001
  shelfLocation: string;   // Məs: "Zal 1, Rəf A-2"
  condition: CopyCondition;
  status: CopyStatus;
  addedDate: string;
  lastAuditDate?: string;
  auditStatus?: "Yoxlanılıb" | "Gözləyir";
}

export interface CreateBookInput {
  title: string;
  author: string;
  isbn?: string;
  udk?: string;
  category: string;
  publisher?: string;
  year?: number | string;
  pages?: number;
  language: BookLanguage;
  initialShelf: string;
  description?: string;
  initialCopiesCount: number;
  inventoryPrefix?: string;
  inventoryStartNumber?: number;
}

const STORAGE_KEY_BOOKS = "libra_ai_books_v1";
const STORAGE_KEY_COPIES = "libra_ai_copies_v1";

// Yaddaşda ilkin boş vəziyyət
let inMemoryBooks: Book[] = [];
let inMemoryCopies: BookCopy[] = [];

function isClient(): boolean {
  return typeof window !== "undefined";
}

function loadFromStorage(): { books: Book[]; copies: BookCopy[] } {
  if (!isClient()) {
    return { books: inMemoryBooks, copies: inMemoryCopies };
  }
  try {
    const rawBooks = localStorage.getItem(STORAGE_KEY_BOOKS);
    const rawCopies = localStorage.getItem(STORAGE_KEY_COPIES);
    const books: Book[] = rawBooks ? JSON.parse(rawBooks) : [];
    const copies: BookCopy[] = rawCopies ? JSON.parse(rawCopies) : [];
    inMemoryBooks = books;
    inMemoryCopies = copies;
    return { books, copies };
  } catch (err) {
    console.error("Storage oxunarkən xəta:", err);
    return { books: inMemoryBooks, copies: inMemoryCopies };
  }
}

function saveToStorage(books: Book[], copies: BookCopy[]): void {
  inMemoryBooks = books;
  inMemoryCopies = copies;
  if (isClient()) {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
      localStorage.setItem(STORAGE_KEY_COPIES, JSON.stringify(copies));
      window.dispatchEvent(new CustomEvent("libra-data-updated"));
    } catch (err) {
      console.error("Storage yazılarkən xəta:", err);
    }
  }
}

/**
 * Bütün kitabları gətirir
 */
export async function getBooks(): Promise<Book[]> {
  const { books } = loadFromStorage();
  return [...books];
}

/**
 * Tək bir kitabı ID-yə görə gətirir
 */
export async function getBookById(id: string): Promise<Book | null> {
  const { books } = loadFromStorage();
  return books.find((b) => b.id === id) || null;
}

/**
 * Bütün fiziki nüsxələri (istəyə görə spesifik kitaba aid) gətirir
 */
export async function getCopies(bookId?: string): Promise<BookCopy[]> {
  const { copies } = loadFromStorage();
  if (bookId) {
    return copies.filter((c) => c.bookId === bookId);
  }
  return [...copies];
}

/**
 * Yeni kitab yaradır və əlaqəli fiziki nüsxələri avtomatik qeydiyyatdan keçirir
 */
export async function createBook(input: CreateBookInput): Promise<{ book: Book; copies: BookCopy[] }> {
  const { books, copies } = loadFromStorage();

  const bookId = `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const copiesCount = Math.max(1, Number(input.initialCopiesCount) || 1);
  const prefix = input.inventoryPrefix?.trim() || "INV-";
  const startNum = Number(input.inventoryStartNumber) || (1000 + copies.length + 1);

  // Fiziki nüsxələrin avtomatik formalaşdırılması
  const newCopies: BookCopy[] = [];
  for (let i = 0; i < copiesCount; i++) {
    const invNumber = `${prefix}${String(startNum + i).padStart(4, "0")}`;
    const copyId = `c-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
    newCopies.push({
      id: copyId,
      bookId,
      bookTitle: input.title.trim(),
      bookAuthor: input.author.trim(),
      inventoryNumber: invNumber,
      shelfLocation: input.initialShelf?.trim() || "Zal 1, Rəf A-1",
      condition: "Əla",
      status: "Fondda",
      addedDate: now.split("T")[0],
    });
  }

  const newBook: Book = {
    id: bookId,
    title: input.title.trim(),
    author: input.author.trim(),
    isbn: input.isbn?.trim() || "",
    udk: input.udk?.trim() || "",
    category: input.category?.trim() || "Ümumi",
    publisher: input.publisher?.trim() || "",
    year: input.year ? String(input.year).trim() : "",
    pages: input.pages ? Number(input.pages) : undefined,
    language: input.language || "Azərbaycan",
    copiesCount: copiesCount,
    availableCount: copiesCount,
    initialShelf: input.initialShelf?.trim() || "Zal 1, Rəf A-1",
    description: input.description?.trim() || "",
    createdAt: now,
  };

  const updatedBooks = [newBook, ...books];
  const updatedCopies = [...newCopies, ...copies];

  saveToStorage(updatedBooks, updatedCopies);

  // Firestore sync
  try {
    const bookRef = doc(db, "books", bookId);
    setDoc(bookRef, newBook, { merge: true }).catch(() => {});
    for (const copy of newCopies) {
      setDoc(doc(db, "book_copies", copy.id), copy, { merge: true }).catch(() => {});
    }
  } catch {
    // fallback
  }

  return { book: newBook, copies: newCopies };
}

/**
 * Kitab məlumatlarını redaktə edir
 */
export async function updateBook(id: string, updates: Partial<Book>): Promise<Book> {
  const { books, copies } = loadFromStorage();
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error("Kitab tapılmadı");
  }

  const updatedBook = { ...books[index], ...updates };
  books[index] = updatedBook;

  // Əgər kitabın adı və ya müəllifi dəyişibsə, əlaqəli nüsxələrdə də yeniləyirik
  if (updates.title || updates.author) {
    copies.forEach((c) => {
      if (c.bookId === id) {
        if (updates.title) c.bookTitle = updates.title;
        if (updates.author) c.bookAuthor = updates.author;
        try {
          setDoc(doc(db, "book_copies", c.id), { bookTitle: c.bookTitle, bookAuthor: c.bookAuthor }, { merge: true }).catch(() => {});
        } catch {}
      }
    });
  }

  saveToStorage(books, copies);

  // Firestore sync
  try {
    setDoc(doc(db, "books", id), updatedBook, { merge: true }).catch(() => {});
  } catch {}

  return updatedBook;
}

/**
 * Kitabı və əlaqəli bütün nüsxələri silir
 */
export async function deleteBook(id: string): Promise<void> {
  const { books, copies } = loadFromStorage();
  const bookCopies = copies.filter((c) => c.bookId === id);
  const updatedBooks = books.filter((b) => b.id !== id);
  const updatedCopies = copies.filter((c) => c.bookId !== id);
  saveToStorage(updatedBooks, updatedCopies);

  // Firestore sync
  try {
    deleteDoc(doc(db, "books", id)).catch(() => {});
    for (const c of bookCopies) {
      deleteDoc(doc(db, "book_copies", c.id)).catch(() => {});
    }
  } catch {}
}

/**
 * Fiziki nüsxənin vəziyyətini, rəf yerini və ya statusunu yeniləyir
 */
export async function updateCopy(id: string, updates: Partial<BookCopy>): Promise<BookCopy> {
  const { books, copies } = loadFromStorage();
  const index = copies.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Nüsxə tapılmadı");
  }

  const prevStatus = copies[index].status;
  const updatedCopy = { ...copies[index], ...updates };
  copies[index] = updatedCopy;

  // Əgər status dəyişibsə (məsələn Fondda -> Oxucuda və ya Silinib), kitabın availableCount sayını yeniləyirik
  if (updates.status && updates.status !== prevStatus) {
    const book = books.find((b) => b.id === updatedCopy.bookId);
    if (book) {
      const bookCopies = copies.filter((c) => c.bookId === book.id);
      book.copiesCount = bookCopies.filter((c) => c.status !== "Silinib").length;
      book.availableCount = bookCopies.filter((c) => c.status === "Fondda").length;
      try {
        setDoc(doc(db, "books", book.id), { copiesCount: book.copiesCount, availableCount: book.availableCount }, { merge: true }).catch(() => {});
      } catch {}
    }
  }

  saveToStorage(books, copies);

  // Firestore sync
  try {
    setDoc(doc(db, "book_copies", id), updatedCopy, { merge: true }).catch(() => {});
  } catch {}

  return updatedCopy;
}

/**
 * Fiziki nüsxəni silir
 */
export async function deleteCopy(id: string): Promise<void> {
  const { books, copies } = loadFromStorage();
  const targetCopy = copies.find((c) => c.id === id);
  if (!targetCopy) return;

  const updatedCopies = copies.filter((c) => c.id !== id);

  // Kitabın sayğaclarını yeniləyirik
  const book = books.find((b) => b.id === targetCopy.bookId);
  if (book) {
    const bookCopies = updatedCopies.filter((c) => c.bookId === book.id);
    book.copiesCount = bookCopies.filter((c) => c.status !== "Silinib").length;
    book.availableCount = bookCopies.filter((c) => c.status === "Fondda").length;
    try {
      setDoc(doc(db, "books", book.id), { copiesCount: book.copiesCount, availableCount: book.availableCount }, { merge: true }).catch(() => {});
    } catch {}
  }

  saveToStorage(books, updatedCopies);

  // Firestore sync
  try {
    deleteDoc(doc(db, "book_copies", id)).catch(() => {});
  } catch {}
}

/**
 * İnventarlaşdırma zamanı fiziki nüsxənin audit statusunu təsdiqləyir
 */
export async function verifyAuditCopy(
  id: string,
  options: {
    condition?: CopyCondition;
    shelfLocation?: string;
    status?: CopyStatus;
  }
): Promise<BookCopy> {
  const { books, copies } = loadFromStorage();
  const index = copies.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Nüsxə tapılmadı");

  const now = new Date().toISOString().split("T")[0];
  const target = copies[index];

  const updatedCopy: BookCopy = {
    ...target,
    condition: options.condition || target.condition,
    shelfLocation: options.shelfLocation || target.shelfLocation,
    status: options.status || target.status,
    lastAuditDate: now,
    auditStatus: "Yoxlanılıb",
  };

  copies[index] = updatedCopy;

  // Əgər status dəyişibsə, kitab sayğaclarını yeniləyirik
  if (options.status && options.status !== target.status) {
    const book = books.find((b) => b.id === target.bookId);
    if (book) {
      const bookCopies = copies.filter((c) => c.bookId === book.id);
      book.copiesCount = bookCopies.filter((c) => c.status !== "Silinib" && c.status !== "İtmiş").length;
      book.availableCount = bookCopies.filter((c) => c.status === "Fondda").length;
    }
  }

  saveToStorage(books, copies);
  return updatedCopy;
}

