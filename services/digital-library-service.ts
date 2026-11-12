/**
 * Peşə Kitabxanası - Rəqəmsal Kitabxana Servisi (Digital Library Service)
 * 
 * Elektron dərsliklər, tədris vəsaitləri və rəqəmsal resursların idarə olunması.
 */

import { db, storage } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

export interface DigitalResource {
  id: string;
  title: string;
  author: string;
  category: string;
  format: "PDF" | "EPUB" | "DOCX";
  fileSize: string;
  fileUrl?: string;
  storagePath?: string;
  description?: string;
  uploadDate: string;
  downloadsCount: number;
}

const STORAGE_KEY_DIGITAL = "libra_ai_digital_resources_v1";

const INITIAL_RESOURCES: DigitalResource[] = [
  {
    id: "dig-1",
    title: "Veb Proqramlaşdırma Əsasları və Müasir Frontend Texnologiyaları",
    author: "R. Məmmədov, E. Əliyev",
    category: "İnformasiya Texnologiyaları",
    format: "PDF",
    fileSize: "5.8 MB",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    description: "HTML5, CSS3, JavaScript ES6+ və React əsaslı veb tətbiqlərin yaradılması üzrə dərslik və laboratoriya işləri toplusu.",
    uploadDate: "2026-03-10",
    downloadsCount: 42,
  },
  {
    id: "dig-2",
    title: "Daxili Yanma Mühərriklərinin Konstruksiyası və Diaqnostikası",
    author: "V. Həsənov",
    category: "Avtomobil Mühəndisliyi",
    format: "PDF",
    fileSize: "8.2 MB",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    description: "Müasir avtomobillərin güc aqreqatlarının texniki xidməti və kompüter diaqnostikası üzrə praktiki təlimat.",
    uploadDate: "2026-02-18",
    downloadsCount: 29,
  },
  {
    id: "dig-3",
    title: "Sənaye Elektrik Avadanlıqlarının Montajı və Təhlükəsizlik Qaydaları",
    author: "K. Qasımov",
    category: "Elektrotexnika və Energetika",
    format: "DOCX",
    fileSize: "2.4 MB",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    description: "Elektrik şəbəkələrinin quraşdırılması, rele mühafizəsi və əməyin mühafizəsi üzrə metodiki vəsait.",
    uploadDate: "2026-01-25",
    downloadsCount: 17,
  },
];

let inMemoryDigital: DigitalResource[] = [];

function isClient(): boolean {
  return typeof window !== "undefined";
}

function loadDigitalData(): DigitalResource[] {
  if (!isClient()) return inMemoryDigital.length ? inMemoryDigital : INITIAL_RESOURCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIGITAL);
    if (raw) {
      const parsed: DigitalResource[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryDigital = parsed;
        return parsed;
      }
    }
    // Default initial seed
    inMemoryDigital = INITIAL_RESOURCES;
    localStorage.setItem(STORAGE_KEY_DIGITAL, JSON.stringify(INITIAL_RESOURCES));
    return INITIAL_RESOURCES;
  } catch (err) {
    console.error("Elektron resurslar oxunarkən xəta:", err);
    return inMemoryDigital.length ? inMemoryDigital : INITIAL_RESOURCES;
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

export async function getDigitalResources(): Promise<DigitalResource[]> {
  const local = loadDigitalData();
  try {
    // Attempt Firestore sync
    const snap = await getDocs(collection(db, "digital_resources"));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DigitalResource));
      // Merge unique
      const mergedMap = new Map<string, DigitalResource>();
      local.forEach((r) => mergedMap.set(r.id, r));
      remote.forEach((r) => mergedMap.set(r.id, r));
      const merged = Array.from(mergedMap.values());
      saveDigitalData(merged);
      return merged;
    }
  } catch {
    // Offline or rules restriction fallback
  }
  return [...local];
}

export async function createDigitalResource(input: {
  title: string;
  author: string;
  category: string;
  format: "PDF" | "EPUB" | "DOCX";
  fileSize?: string;
  fileUrl?: string;
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
  } catch {
    // fallback
  }

  return newResource;
}

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
  } catch {
    // fallback
  }

  return updatedResource;
}

export async function deleteDigitalResource(id: string): Promise<void> {
  const data = loadDigitalData();
  const target = data.find((d) => d.id === id);
  const updated = data.filter((d) => d.id !== id);
  saveDigitalData(updated);

  // Firestore delete
  try {
    const docRef = doc(db, "digital_resources", id);
    await deleteDoc(docRef);
  } catch {
    // fallback
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
