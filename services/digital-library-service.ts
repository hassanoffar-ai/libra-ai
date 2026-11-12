/**
 * Peşə Kitabxanası - Rəqəmsal Kitabxana Servisi (Digital Library Service)
 * 
 * 100% Real Verilənlər Bazası (Firebase Firestore & Firebase Storage)
 * Heç bir saxta və ya mock resurs daxil edilməyib.
 */

import { db, storage } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

export interface DigitalResource {
  id: string;
  title: string;
  author: string;
  category: string;
  format: "PDF" | "EPUB" | "DOCX" | "DOC" | "PPTX" | "XLSX" | string;
  fileSize: string;
  fileUrl?: string;
  fileName?: string;       // Original filename with extension, e.g. "riyaziyyat_derslik.docx"
  storagePath?: string;
  description?: string;
  uploadDate: string;
  downloadsCount: number;
}

const STORAGE_KEY_DIGITAL = "libra_ai_digital_resources_v1";

let inMemoryDigital: DigitalResource[] = [];

function isClient(): boolean {
  return typeof window !== "undefined";
}

function loadDigitalData(): DigitalResource[] {
  if (!isClient()) return inMemoryDigital;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIGITAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryDigital = parsed;
        return parsed;
      }
    }
    return [];
  } catch (err) {
    console.error("Elektron resurslar oxunarkən xəta:", err);
    return [];
  }
}

function saveDigitalData(data: DigitalResource[]): void {
  inMemoryDigital = data;
  if (isClient()) {
    try {
      localStorage.setItem(STORAGE_KEY_DIGITAL, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("libra-data-updated"));
    } catch (err) {
      console.error("Elektron resurslar saxlanarkən xəta:", err);
    }
  }
}

/**
 * Bütün elektron resursları canlı bazadan (Firestore) gətirir
 */
export async function getDigitalResources(): Promise<DigitalResource[]> {
  const local = loadDigitalData();
  try {
    const snap = await getDocs(collection(db, "digital_resources"));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DigitalResource));
      saveDigitalData(remote);
      return remote;
    } else if (local.length > 0) {
      // If Firestore is empty, sync local items up if any exist
      for (const item of local) {
        setDoc(doc(db, "digital_resources", item.id), item, { merge: true }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Firestore digital resources sync error (offline fallback):", err);
  }
  return [...local];
}

/**
 * Yeni elektron resurs yaradır və bazada saxlayır
 */
export async function createDigitalResource(input: {
  title: string;
  author: string;
  category: string;
  format: "PDF" | "EPUB" | "DOCX" | "DOC" | "PPTX" | "XLSX" | string;
  fileSize?: string;
  fileUrl?: string;
  fileName?: string;
  storagePath?: string;
  description?: string;
}): Promise<DigitalResource> {
  const data = loadDigitalData();

  const id = `dig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString().split("T")[0];

  const newResource: DigitalResource = {
    id,
    title: input.title.trim(),
    author: input.author.trim(),
    category: input.category.trim(),
    format: input.format || "PDF",
    fileSize: input.fileSize || "3.5 MB",
    fileUrl: input.fileUrl?.trim() || "",
    fileName: input.fileName?.trim() || "",
    storagePath: input.storagePath || "",
    description: input.description?.trim() || "",
    uploadDate: now,
    downloadsCount: 0,
  };

  const updated = [newResource, ...data];
  saveDigitalData(updated);

  // Firestore sync
  try {
    const docRef = doc(db, "digital_resources", id);
    await setDoc(docRef, newResource, { merge: true });
  } catch (err) {
    console.warn("Firestore save error:", err);
  }

  return newResource;
}

/**
 * Elektron resursu redaktə edir
 */
export async function updateDigitalResource(
  id: string,
  input: Partial<Omit<DigitalResource, "id">>
): Promise<DigitalResource> {
  const data = loadDigitalData();
  const index = data.findIndex((d) => d.id === id);
  if (index === -1) {
    throw new Error("Resurs tapılmadı");
  }

  const updatedResource: DigitalResource = {
    ...data[index],
    ...input,
  };
  data[index] = updatedResource;
  saveDigitalData(data);

  // Firestore sync
  try {
    const docRef = doc(db, "digital_resources", id);
    await setDoc(docRef, updatedResource, { merge: true });
  } catch (err) {
    console.warn("Firestore update error:", err);
  }

  return updatedResource;
}

/**
 * Elektron resursu bazadan və Storage-dan silir
 */
export async function deleteDigitalResource(id: string): Promise<void> {
  const data = loadDigitalData();
  const target = data.find((d) => d.id === id);
  const updated = data.filter((d) => d.id !== id);
  saveDigitalData(updated);

  // Firestore delete
  try {
    const docRef = doc(db, "digital_resources", id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete error:", err);
  }

  // Storage delete if applicable
  if (target?.storagePath) {
    try {
      const storageRef = ref(storage, target.storagePath);
      await deleteObject(storageRef);
    } catch {
      // ignore
    }
  }
}

/**
 * Endirmə sayğacını bazada artırır
 */
export async function incrementDownload(id: string): Promise<void> {
  const data = loadDigitalData();
  const target = data.find((d) => d.id === id);
  if (target) {
    target.downloadsCount = (target.downloadsCount || 0) + 1;
    saveDigitalData(data);
    try {
      const docRef = doc(db, "digital_resources", id);
      await setDoc(docRef, { downloadsCount: target.downloadsCount }, { merge: true });
    } catch {
      // ignore
    }
  }
}

/**
 * Orijinal formatda birbaşa fayl endirməsi (PDF, DOCX, DOC, EPUB, PPTX və s.)
 */
export async function downloadDigitalResource(res: DigitalResource): Promise<void> {
  if (!res.fileUrl) {
    alert("Fayl linki mövcud deyil.");
    return;
  }

  // 1. Sayğacı artırırıq
  await incrementDownload(res.id);

  // 2. Orijinal fayl adı və uzantısını müəyyən edirik
  let downloadName = res.fileName?.trim() || "";
  if (!downloadName) {
    const ext = res.format ? `.${res.format.toLowerCase()}` : ".pdf";
    const cleanTitle = res.title.replace(/[^a-zA-Z0-9_\u0400-\u04FF\u0100-\u017F-]/g, "_");
    downloadName = `${cleanTitle}${ext}`;
  }

  // 3. Blob fetch vasitəsilə birbaşa kompüterə orijinal formatda yüklənmə
  try {
    const response = await fetch(res.fileUrl);
    if (!response.ok) throw new Error("Fayl endirilərkən şəbəkə xətası baş verdi");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Şəbəkə / CORS məhdudiyyəti olarsa klassik fallback
    const link = document.createElement("a");
    link.href = res.fileUrl;
    link.download = downloadName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
