/**
 * Peşə Kitabxanası - Rəqəmsal Kitabxana Servisi (Digital Library Service)
 * 
 * Elektron dərsliklər, tədris vəsaitləri və rəqəmsal resursların idarə olunması.
 */

export interface DigitalResource {
  id: string;
  title: string;
  author: string;
  category: string;
  format: "PDF" | "EPUB" | "DOCX";
  fileSize: string;
  fileUrl?: string;
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
    const data: DigitalResource[] = raw ? JSON.parse(raw) : [];
    inMemoryDigital = data;
    return data;
  } catch (err) {
    console.error("Elektron resurslar oxunarkən xəta:", err);
    return inMemoryDigital;
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
  const data = loadDigitalData();
  return [...data];
}

export async function createDigitalResource(input: {
  title: string;
  author: string;
  category: string;
  format: "PDF" | "EPUB" | "DOCX";
  fileSize?: string;
  fileUrl?: string;
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
    description: input.description?.trim() || "",
    uploadDate: now,
    downloadsCount: 0,
  };

  const updated = [newResource, ...data];
  saveDigitalData(updated);
  return newResource;
}

export async function deleteDigitalResource(id: string): Promise<void> {
  const data = loadDigitalData();
  const updated = data.filter((d) => d.id !== id);
  saveDigitalData(updated);
}

export async function incrementDownload(id: string): Promise<void> {
  const data = loadDigitalData();
  const target = data.find((d) => d.id === id);
  if (target) {
    target.downloadsCount = (target.downloadsCount || 0) + 1;
    saveDigitalData(data);
  }
}

