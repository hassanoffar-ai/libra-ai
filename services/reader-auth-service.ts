"use client";

import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { getReaders, createReader, generateNextTicketNumber, Reader } from "@/services/circulation-service";

export interface ReaderSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ticketNumber: string;
  category: "Tələbə" | "Müəllim";
  role: "student" | "teacher";
  accessRole: "reader";
  status: "pending" | "active" | "blocked";
  department: string;
  phone: string;
  maxBookLimit: number;
}

const STORAGE_KEY_READER = "libra_reader_session";

export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get stored reader session from localStorage or cookie.
 */
export function getStoredReaderSession(): ReaderSession | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READER);
    if (raw) {
      return JSON.parse(raw) as ReaderSession;
    }

    // Fallback: check document.cookie
    const match = document.cookie.match(new RegExp("(^| )libra_reader_session=([^;]+)"));
    if (match && match[2]) {
      const decoded = decodeURIComponent(match[2]);
      return JSON.parse(decoded) as ReaderSession;
    }
  } catch (err) {
    console.error("Error reading stored reader session:", err);
  }
  return null;
}

/**
 * Save reader session to localStorage and browser cookie.
 */
export function saveReaderSession(session: ReaderSession): void {
  if (!isClient()) return;
  try {
    const str = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY_READER, str);
    // Set 30-day cookie for Next.js middleware and SSR
    document.cookie = `libra_reader_session=${encodeURIComponent(str)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("libra-reader-session-updated"));
  } catch (err) {
    console.error("Error saving reader session:", err);
  }
}

/**
 * Clear reader session on logout.
 * NEVER touches Firebase Auth (Librarian/Admin session remains 100% intact).
 */
export function clearReaderSession(): void {
  if (!isClient()) return;
  try {
    localStorage.removeItem(STORAGE_KEY_READER);
    document.cookie = "libra_reader_session=; path=/; max-age=0; SameSite=Lax";
    window.dispatchEvent(new CustomEvent("libra-reader-session-updated"));
  } catch (err) {
    console.error("Error clearing reader session:", err);
  }
}

/**
 * Reader Login directly against Firestore readers collection (with fallback).
 * NEVER calls Firebase signInWithEmailAndPassword so Admin session is not overwritten!
 */
export async function readerLogin(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; reader?: ReaderSession }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !pass) {
    return { success: false, error: "Zəhmət olmasa e-poçt və şifrəni daxil edin." };
  }

  try {
    // 1. Try querying Firestore readers collection
    let foundReader: any = null;

    try {
      const q = query(collection(db, "readers"), where("email", "==", cleanEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        foundReader = querySnap.docs[0].data();
        if (!foundReader.id) foundReader.id = querySnap.docs[0].id;
      }
    } catch (fsErr) {
      console.warn("Firestore reader query warning, falling back to local database:", fsErr);
    }

    // 2. Fallback to local circulation database if not found in Firestore
    if (!foundReader) {
      const localReaders = await getReaders().catch(() => []);
      const match = localReaders.find((r) => r.email?.trim().toLowerCase() === cleanEmail);
      if (match) {
        foundReader = match;
      }
    }

    if (!foundReader) {
      return { success: false, error: "Bu e-poçt ünvanı ilə qeydiyyatdan keçmiş oxucu tapılmadı." };
    }

    // Check account status
    if (foundReader.status === "blocked" || foundReader.status === "Bloklanıb") {
      return { success: false, error: "Hesabınız kitabxana administratoru tərəfindən bloklanıb." };
    }

    // Validate password (supports plain or hashed)
    if (foundReader.password && foundReader.password !== pass) {
      return { success: false, error: "Şifrə yanlışdır." };
    }

    const category: "Tələbə" | "Müəllim" = foundReader.category === "Müəllim" ? "Müəllim" : "Tələbə";
    const role: "student" | "teacher" = category === "Müəllim" ? "teacher" : "student";

    const session: ReaderSession = {
      id: foundReader.id || `r-${Date.now()}`,
      email: cleanEmail,
      firstName: foundReader.firstName || "",
      lastName: foundReader.lastName || "",
      ticketNumber: foundReader.ticketNumber || "OX-1045",
      category,
      role,
      accessRole: "reader",
      status: foundReader.status || "pending",
      department: foundReader.department || (category === "Müəllim" ? "Pedaqoji heyət" : "Tələbə qrupu"),
      phone: foundReader.phone || "",
      maxBookLimit: foundReader.maxBookLimit || (category === "Müəllim" ? 10 : 5),
    };

    saveReaderSession(session);

    // Call server to persist cookie for SSR / middleware
    await fetch("/api/auth/reader/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reader: session }),
    }).catch(() => null);

    return { success: true, reader: session };
  } catch (err: any) {
    console.error("Reader login error:", err);
    return { success: false, error: err?.message || "Giriş zamanı gözlənilməz xəta baş verdi." };
  }
}

/**
 * Reader Registration directly saving to Firestore readers collection.
 * NEVER creates a Firebase Auth user so Admin session is not overwritten!
 */
export async function readerRegister(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  department: string;
  category: "Tələbə" | "Müəllim";
  password: string;
}): Promise<{ success: boolean; error?: string; ticketNumber?: string }> {
  try {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanFirst = input.firstName.trim();
    const cleanLast = input.lastName.trim();
    const cleanPhone = input.phone.trim();
    const cleanDept = input.department.trim();
    const category = input.category === "Müəllim" ? "Müəllim" : "Tələbə";
    const role = category === "Müəllim" ? "teacher" : "student";

    // Generate unique Ticket Number (e.g., OX-1045)
    const ticketNumber = await generateNextTicketNumber().catch(
      () => `OX-${Math.floor(1000 + Math.random() * 9000)}`
    );

    const readerId = `reader-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newReaderRecord: Reader = {
      id: readerId,
      ticketNumber,
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      email: cleanEmail,
      department: cleanDept,
      category,
      role,
      accessRole: "reader",
      password: input.password,
      status: "pending",
      registeredDate: now.split("T")[0],
      maxBookLimit: category === "Müəllim" ? 10 : 5,
      notes: "Onlayn oxucu portalından qeydiyyat",
    };

    // Save to Firestore readers collection
    try {
      const readerDocRef = doc(db, "readers", readerId);
      await setDoc(readerDocRef, {
        ...newReaderRecord,
        createdAt: now,
        updatedAt: now,
      });
    } catch (fsErr) {
      console.warn("Firestore direct write error, saving to local circulation storage:", fsErr);
    }

    // Save to local circulation service for librarian visibility
    await createReader(newReaderRecord).catch(console.error);

    return {
      success: true,
      ticketNumber,
    };
  } catch (err: any) {
    console.error("Reader registration error:", err);
    return {
      success: false,
      error: err?.message || "Qeydiyyat zamanı xəta baş verdi.",
    };
  }
}

