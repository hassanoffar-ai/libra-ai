"use client";

import { db } from "@/lib/firebase/client";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { getBooks, getCopies, Book, BookCopy } from "@/services/books-service";

export interface CatalogBook {
  id: string;
  title: string;
  author: string;
  category: string;
  year: string;
  initialShelf: string;
  shelfLocation: string;
  copiesCount: number;
  availableCount: number;
  description?: string;
  isbn?: string;
  isAvailable: boolean;
}

// Initial LDPTM vocational textbooks used when database is freshly initialized
const DEFAULT_VOCATIONAL_BOOKS: CatalogBook[] = [
  {
    id: "b-voc-101",
    title: "Kompüter sistemlərində proqramlaşdırma əsasları",
    author: "R. Əliyev, T. Quliyev",
    category: "İnformasiya Texnologiyaları",
    year: "2024",
    initialShelf: "Zal 1, Rəf A-2",
    shelfLocation: "Zal 1, Rəf A-2",
    copiesCount: 5,
    availableCount: 3,
    isAvailable: true,
    description: "Alqoritmik dillər, verilənlər bazası və müasir proqramlaşdırma texnologiyaları üzrə tədris vəsaiti.",
    isbn: "978-9952-401-22-1",
  },
  {
    id: "b-voc-102",
    title: "Müasir Aqronomluq və Bitkiçilik Texnologiyaları",
    author: "S. Məmmədov",
    category: "Kənd Təsərrüfatı",
    year: "2023",
    initialShelf: "Zal 2, Rəf B-1",
    shelfLocation: "Zal 2, Rəf B-1",
    copiesCount: 4,
    availableCount: 4,
    isAvailable: true,
    description: "Lənkəran-Astara bölgəsində subtropik və çayçılıq təsərrüfatının aqrotexniki əsasları.",
    isbn: "978-9952-402-15-4",
  },
  {
    id: "b-voc-103",
    title: "Elektrik təchizatı və avtomatlaşdırma",
    author: "Q. Həsənov",
    category: "Mühəndislik və Energetika",
    year: "2022",
    initialShelf: "Zal 1, Rəf C-3",
    shelfLocation: "Zal 1, Rəf C-3",
    copiesCount: 3,
    availableCount: 2,
    isAvailable: true,
    description: "Sənaye müəssisələrinin və binaların elektrik xətlərinin montajı və təhlükəsizlik qaydaları.",
    isbn: "978-9952-334-09-8",
  },
  {
    id: "b-voc-104",
    title: "Aşpazlıq və Milli Kulinariya Sənəti",
    author: "N. Qasımova",
    category: "İaşə və Turizm",
    year: "2023",
    initialShelf: "Zal 3, Rəf D-1",
    shelfLocation: "Zal 3, Rəf D-1",
    copiesCount: 3,
    availableCount: 1,
    isAvailable: true,
    description: "Milli və dünya mətbəxinin texnoloji xəritələri, süfrə mədəniyyəti və kulinariya gigiyenası.",
    isbn: "978-9952-512-88-0",
  },
  {
    id: "b-voc-105",
    title: "Avtomobillərin diaqnostikası və təmiri",
    author: "E. Hüseynov",
    category: "Nəqliyyat və Mexanika",
    year: "2022",
    initialShelf: "Zal 2, Rəf E-4",
    shelfLocation: "Zal 2, Rəf E-4",
    copiesCount: 2,
    availableCount: 0,
    isAvailable: false,
    description: "Mühərriklərin elektron idarəetmə sistemləri və avtomobil aqreqatlarının sazlanması.",
    isbn: "978-9952-601-33-7",
  },
  {
    id: "b-voc-106",
    title: "Dərzi və Modelçilik Texnologiyası",
    author: "F. Babayeva",
    category: "Tekstil və Dizayn",
    year: "2024",
    initialShelf: "Zal 3, Rəf F-2",
    shelfLocation: "Zal 3, Rəf F-2",
    copiesCount: 4,
    availableCount: 4,
    isAvailable: true,
    description: "Geyimlərin konstruksiya edilməsi, biçmə və tikmə texnikasının incəlikləri.",
    isbn: "978-9952-441-11-9",
  },
];

/**
 * Fetch catalog books directly from Firebase Firestore collections:
 * `books` and `book_copies` with real-time status and availability calculation.
 */
export async function fetchFirebaseCatalogBooks(): Promise<CatalogBook[]> {
  try {
    // 1. Fetch books and copies from Firebase Firestore
    const [booksSnap, copiesSnap] = await Promise.all([
      getDocs(collection(db, "books")).catch((err) => {
        console.warn("Firestore books collection read warning:", err);
        return null;
      }),
      getDocs(collection(db, "book_copies")).catch((err) => {
        console.warn("Firestore book_copies collection read warning:", err);
        return null;
      }),
    ]);

    const firestoreCopies: BookCopy[] = [];
    if (copiesSnap && !copiesSnap.empty) {
      copiesSnap.forEach((d) => {
        const data = d.data() as any;
        firestoreCopies.push({
          id: d.id,
          bookId: data.bookId,
          bookTitle: data.bookTitle || "",
          bookAuthor: data.bookAuthor || "",
          inventoryNumber: data.inventoryNumber || "",
          shelfLocation: data.shelfLocation || "",
          condition: data.condition || "Yaxşı",
          status: data.status || "Fondda",
          addedDate: data.addedDate || "",
        });
      });
    }

    const firestoreBooks: CatalogBook[] = [];
    if (booksSnap && !booksSnap.empty) {
      booksSnap.forEach((d) => {
        const data = d.data() as any;
        const matchingCopies = firestoreCopies.filter((c) => c.bookId === d.id);
        const availableInCopies = matchingCopies.filter((c) => c.status === "Fondda").length;

        // If copies exist in subcollection, calculate from them; otherwise use book field
        const availableCount =
          matchingCopies.length > 0
            ? availableInCopies
            : typeof data.availableCount === "number"
            ? data.availableCount
            : typeof data.copiesCount === "number"
            ? data.copiesCount
            : 1;

        const copiesCount =
          matchingCopies.length > 0
            ? matchingCopies.filter((c) => c.status !== "Silinib").length
            : typeof data.copiesCount === "number"
            ? data.copiesCount
            : Math.max(availableCount, 1);

        const shelf =
          data.initialShelf ||
          (matchingCopies[0]?.shelfLocation) ||
          "Mərkəzi Fond";

        firestoreBooks.push({
          id: d.id,
          title: data.title || "Adsız kitab",
          author: data.author || "Müəllif qeyd edilməyib",
          category: data.category || "Ümumi",
          year: String(data.year || "2023"),
          initialShelf: shelf,
          shelfLocation: shelf,
          copiesCount,
          availableCount,
          isAvailable: availableCount > 0,
          description: data.description || "",
          isbn: data.isbn || "",
        });
      });
    }

    if (firestoreBooks.length > 0) {
      return firestoreBooks;
    }
  } catch (err) {
    console.warn("Direct Firebase catalog fetch error, checking local fallback:", err);
  }

  // 2. Fallback: check local storage books from books-service
  try {
    const [localBooks, localCopies] = await Promise.all([
      getBooks().catch(() => []),
      getCopies().catch(() => []),
    ]);

    if (localBooks && localBooks.length > 0) {
      return localBooks.map((b) => {
        const matchingCopies = localCopies.filter((c) => c.bookId === b.id);
        const availableInCopies = matchingCopies.filter((c) => c.status === "Fondda").length;
        const availableCount =
          matchingCopies.length > 0 ? availableInCopies : b.availableCount ?? b.copiesCount;

        const shelf = b.initialShelf || matchingCopies[0]?.shelfLocation || "Zal 1, Rəf A-1";

        return {
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          year: String(b.year || "2023"),
          initialShelf: shelf,
          shelfLocation: shelf,
          copiesCount: b.copiesCount,
          availableCount,
          isAvailable: availableCount > 0,
          description: b.description,
          isbn: b.isbn,
        };
      });
    }
  } catch (err) {
    console.error("Local books fallback error:", err);
  }

  // 3. Fallback: return default vocational library catalog
  return DEFAULT_VOCATIONAL_BOOKS;
}

/**
 * Filter catalog books by query (Title, Author, Category), Category filter, and Availability
 */
export function filterCatalogBooks(
  books: CatalogBook[],
  queryText: string,
  categoryFilter: string = "all",
  onlyAvailable: boolean = false
): CatalogBook[] {
  const q = queryText.trim().toLowerCase();

  return books.filter((book) => {
    // Search query matches Title, Author, or Category
    if (q) {
      const matchTitle = book.title.toLowerCase().includes(q);
      const matchAuthor = book.author.toLowerCase().includes(q);
      const matchCategory = book.category.toLowerCase().includes(q);
      const matchIsbn = book.isbn ? book.isbn.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchAuthor && !matchCategory && !matchIsbn) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter !== "all" && book.category !== categoryFilter) {
      return false;
    }

    // Only available filter
    if (onlyAvailable && !book.isAvailable) {
      return false;
    }

    return true;
  });
}

