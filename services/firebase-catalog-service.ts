"use client";

import { db } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";
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

/**
 * Fetch catalog books directly from Firebase Firestore collections:
 * `books` and `book_copies` with real-time status and availability calculation.
 * 100% Real Live Database only - No Mock or Sample Fallbacks.
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

        const availableCount =
          matchingCopies.length > 0
            ? availableInCopies
            : typeof data.availableCount === "number"
            ? data.availableCount
            : typeof data.copiesCount === "number"
            ? data.copiesCount
            : 0;

        const copiesCount =
          matchingCopies.length > 0
            ? matchingCopies.filter((c) => c.status !== "Silinib").length
            : typeof data.copiesCount === "number"
            ? data.copiesCount
            : availableCount;

        const shelf =
          data.initialShelf ||
          (matchingCopies[0]?.shelfLocation) ||
          "Mərkəzi Fond";

        firestoreBooks.push({
          id: d.id,
          title: data.title || "Adsız kitab",
          author: data.author || "Müəllif qeyd edilməyib",
          category: data.category || "Ümumi",
          year: String(data.year || ""),
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
    console.warn("Direct Firebase catalog fetch warning:", err);
  }

  // 2. Check local books if offline / indexed
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

        const shelf = b.initialShelf || matchingCopies[0]?.shelfLocation || "Mərkəzi Fond";

        return {
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          year: String(b.year || ""),
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
    console.error("Local books check error:", err);
  }

  // If database is empty, return empty array (zero state)
  return [];
}

/**
 * Filter catalog books by query (Title, Author, Category, ISBN), Category filter, and Availability
 */
export function filterCatalogBooks(
  books: CatalogBook[],
  queryText: string,
  categoryFilter: string = "all",
  onlyAvailable: boolean = false
): CatalogBook[] {
  const q = queryText.trim().toLowerCase();

  return books.filter((book) => {
    // Search query matches Title, Author, Category, or ISBN
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
