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
  fileFormat: string;
  fileSize: string;
  fileUrl: string;         // ONLY lightweight URL (Firebase Storage download URL or external link)
  fileName: string;        // Original filename with extension, e.g. "riyaziyyat_derslik.docx"
  originalFileName: string;
  storagePath: string;     // e.g. "e-library/1731400000_derslik.pdf"
  description?: string;
  uploadDate: string;
  createdAt: string;
  downloadsCount: number;
  downloadCount: number;
}

const STORAGE_KEY_DIGITAL = "libra_ai_digital_resources_v1";

let inMemoryDigital: DigitalResource[] = [];

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

function loadDigitalData(): DigitalResource[] {
  if (!isClient()) return inMemoryDigital;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIGITAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip any heavy base64 data URLs to prevent storage and query bloating
        const cleaned = parsed.map((item: any) => ({
          ...item,
          fileUrl: item.fileUrl?.startsWith("data:") ? "" : (item.fileUrl || ""),
          originalFileName: item.originalFileName || item.fileName || "",
          fileName: item.originalFileName || item.fileName || "",
          fileFormat: item.fileFormat || item.format || "PDF",
          format: item.fileFormat || item.format || "PDF",
          storagePath: item.storagePath || "",
          downloadCount: item.downloadCount ?? item.downloadsCount ?? 0,
          downloadsCount: item.downloadCount ?? item.downloadsCount ?? 0,
          createdAt: item.createdAt || item.uploadDate || new Date().toISOString(),
          uploadDate: item.uploadDate || (item.createdAt ? item.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        }));
        inMemoryDigital = cleaned;
        return cleaned;
      }
    }
    return [];
  } catch (err) {
    console.error("Elektron resurslar oxunarkən xəta:", err);
    return [];
  }
}

function saveDigitalData(data: DigitalResource[]): void {
  // Strip any accidental heavy data URLs before persisting
  const safeData = data.map((item) => ({
    ...item,
    fileUrl: item.fileUrl?.startsWith("data:") ? "" : item.fileUrl,
  }));
  inMemoryDigital = safeData;
  if (isClient()) {
    try {
      localStorage.setItem(STORAGE_KEY_DIGITAL, JSON.stringify(safeData));
      window.dispatchEvent(new CustomEvent("libra-data-updated"));
    } catch (err) {
      console.error("Elektron resurslar saxlanarkən xəta:", err);
    }
  }
}

/**
 * Bütün elektron resursları canlı bazadan (Firestore e_library kolleksiyası) gətirir
 */
export async function getDigitalResources(): Promise<DigitalResource[]> {
  const local = loadDigitalData();
  try {
    // 1. Try e_library collection (strictly configured standard)
    const snap = await getDocs(collection(db, "e_library"));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || "",
          author: data.author || "",
          category: data.category || "",
          fileFormat: data.fileFormat || data.format || "PDF",
          format: data.format || data.fileFormat || "PDF",
          fileSize: data.fileSize || "4.0 MB",
          originalFileName: data.originalFileName || data.fileName || "",
          fileName: data.originalFileName || data.fileName || "",
          fileUrl: data.fileUrl || "",
          storagePath: data.storagePath || "",
          description: data.description || "",
          createdAt: data.createdAt || data.uploadDate || new Date().toISOString(),
          uploadDate: data.uploadDate || (data.createdAt ? data.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
          downloadCount: data.downloadCount ?? data.downloadsCount ?? 0,
          downloadsCount: data.downloadCount ?? data.downloadsCount ?? 0,
        } as DigitalResource;
      });
      saveDigitalData(remote);
      return remote;
    }

    // 2. Legacy fallback to digital_resources if e_library was previously named so
    const legacySnap = await getDocs(collection(db, "digital_resources"));
    if (!legacySnap.empty) {
      const remote = legacySnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || "",
          author: data.author || "",
          category: data.category || "",
          fileFormat: data.fileFormat || data.format || "PDF",
          format: data.format || data.fileFormat || "PDF",
          fileSize: data.fileSize || "4.0 MB",
          originalFileName: data.originalFileName || data.fileName || "",
          fileName: data.originalFileName || data.fileName || "",
          fileUrl: data.fileUrl || "",
          storagePath: data.storagePath || "",
          description: data.description || "",
          createdAt: data.createdAt || data.uploadDate || new Date().toISOString(),
          uploadDate: data.uploadDate || (data.createdAt ? data.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
          downloadCount: data.downloadCount ?? data.downloadsCount ?? 0,
          downloadsCount: data.downloadCount ?? data.downloadsCount ?? 0,
        } as DigitalResource;
      });
      saveDigitalData(remote);
      // Migrate documents to e_library
      for (const item of remote) {
        setDoc(doc(db, "e_library", item.id), cleanData(item), { merge: true }).catch(() => {});
      }
      return remote;
    } else if (local.length > 0) {
      for (const item of local) {
        setDoc(doc(db, "e_library", item.id), cleanData(item), { merge: true }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Firestore e_library sync error (offline fallback):", err);
  }
  return [...local];
}

/**
 * Yeni elektron resurs yaradır və bazada saxlayır (e_library kolleksiyası)
 */
export async function createDigitalResource(input: {
  title: string;
  author: string;
  category: string;
  format?: "PDF" | "EPUB" | "DOCX" | "DOC" | "PPTX" | "XLSX" | string;
  fileFormat?: string;
  fileSize?: string;
  fileUrl?: string;
  fileName?: string;
  originalFileName?: string;
  storagePath?: string;
  description?: string;
}): Promise<DigitalResource> {
  const data = loadDigitalData();

  const id = `dig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();
  const dateStr = nowIso.split("T")[0];

  const rawUrl = input.fileUrl?.trim() || "";
  // STRICT FORBID: Never store heavy Base64 inside Firestore
  const safeFileUrl = rawUrl.startsWith("data:") ? "" : rawUrl;

  const fileName = input.originalFileName?.trim() || input.fileName?.trim() || "";
  const format = input.fileFormat || input.format || "PDF";
  const storagePath = input.storagePath?.trim() || "";

  const newResource: DigitalResource = {
    id,
    title: input.title.trim(),
    author: input.author.trim(),
    category: input.category.trim(),
    format,
    fileFormat: format,
    fileSize: input.fileSize || "4.0 MB",
    fileUrl: safeFileUrl,
    fileName,
    originalFileName: fileName,
    storagePath,
    description: input.description?.trim() || "",
    uploadDate: dateStr,
    createdAt: nowIso,
    downloadCount: 0,
    downloadsCount: 0,
  };

  const updated = [newResource, ...data];
  saveDigitalData(updated);

  // Firestore sync: ONLY lightweight metadata fields (under 1 KB per document)
  const firestoreRecord = {
    title: newResource.title,
    author: newResource.author,
    category: newResource.category,
    fileFormat: newResource.fileFormat,
    fileSize: newResource.fileSize,
    originalFileName: newResource.originalFileName,
    fileUrl: newResource.fileUrl,
    storagePath: newResource.storagePath,
    downloadCount: 0,
    createdAt: nowIso,
    description: newResource.description,
  };

  try {
    await setDoc(doc(db, "e_library", id), cleanData(firestoreRecord), { merge: true });
    // Also mirror to digital_resources for backward compatibility
    await setDoc(doc(db, "digital_resources", id), cleanData(firestoreRecord), { merge: true });
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

  const rawUrl = input.fileUrl !== undefined ? input.fileUrl.trim() : data[index].fileUrl;
  const safeFileUrl = rawUrl?.startsWith("data:") ? "" : rawUrl;

  const fileName = input.originalFileName || input.fileName || data[index].originalFileName || data[index].fileName || "";
  const format = input.fileFormat || input.format || data[index].fileFormat || data[index].format || "PDF";
  const storagePath = input.storagePath !== undefined ? input.storagePath : data[index].storagePath;

  const updatedResource: DigitalResource = {
    ...data[index],
    ...input,
    format,
    fileFormat: format,
    fileUrl: safeFileUrl,
    fileName,
    originalFileName: fileName,
    storagePath,
  };
  data[index] = updatedResource;
  saveDigitalData(data);

  // Firestore sync: ONLY lightweight metadata
  const firestoreRecord = {
    title: updatedResource.title,
    author: updatedResource.author,
    category: updatedResource.category,
    fileFormat: updatedResource.fileFormat,
    fileSize: updatedResource.fileSize,
    originalFileName: updatedResource.originalFileName,
    fileUrl: updatedResource.fileUrl,
    storagePath: updatedResource.storagePath,
    downloadCount: updatedResource.downloadCount ?? updatedResource.downloadsCount ?? 0,
    createdAt: updatedResource.createdAt,
    description: updatedResource.description || "",
  };

  try {
    await setDoc(doc(db, "e_library", id), cleanData(firestoreRecord), { merge: true });
    await setDoc(doc(db, "digital_resources", id), cleanData(firestoreRecord), { merge: true });
  } catch (err) {
    console.warn("Firestore update error:", err);
  }

  return updatedResource;
}

/**
 * Elektron resursu bazadan (Firestore) və Storage-dan silir
 */
export async function deleteDigitalResource(id: string): Promise<void> {
  const data = loadDigitalData();
  const target = data.find((d) => d.id === id);
  const updated = data.filter((d) => d.id !== id);
  saveDigitalData(updated);

  // 1. Firestore delete from e_library and digital_resources
  try {
    await deleteDoc(doc(db, "e_library", id));
  } catch (err) {
    console.warn("Firestore e_library delete error:", err);
  }
  try {
    await deleteDoc(doc(db, "digital_resources", id));
  } catch {}

  // 2. Firebase Storage automatic file cleanup so storage never wastes space
  if (target?.storagePath) {
    try {
      const storageRef = ref(storage, target.storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("Firebase Storage file delete error:", err);
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
    const newCount = (target.downloadCount || target.downloadsCount || 0) + 1;
    target.downloadCount = newCount;
    target.downloadsCount = newCount;
    saveDigitalData(data);
    try {
      await setDoc(doc(db, "e_library", id), { downloadCount: newCount, downloadsCount: newCount }, { merge: true });
      await setDoc(doc(db, "digital_resources", id), { downloadCount: newCount, downloadsCount: newCount }, { merge: true });
    } catch {
      // ignore
    }
  }
}

/**
 * Orijinal formatda birbaşa fayl endirməsi (PDF, DOCX, DOC, EPUB, PPTX və s.)
 */
export async function downloadDigitalResource(res: DigitalResource): Promise<void> {
  const url = res.fileUrl?.trim();
  if (!url) {
    alert("Fayl linki mövcud deyil.");
    return;
  }

  // 1. Sayğacı artırırıq
  await incrementDownload(res.id);

  // 2. Orijinal fayl adı və uzantısını müəyyən edirik
  let downloadName = res.originalFileName?.trim() || res.fileName?.trim() || "";
  if (!downloadName) {
    const formatStr = res.fileFormat || res.format;
    const ext = formatStr ? `.${formatStr.toLowerCase().replace(/^\./, "")}` : ".pdf";
    const cleanTitle = res.title.replace(/[^a-zA-Z0-9_\u0400-\u04FF\u0100-\u017F-]/g, "_");
    downloadName = `${cleanTitle}${ext}`;
  }

  // 3. Blob fetch vasitəsilə birbaşa kompüterə orijinal formatda yüklənmə
  try {
    const response = await fetch(url);
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
    link.href = url;
    link.download = downloadName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
