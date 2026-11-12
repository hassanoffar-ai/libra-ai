/**
 * Peşə Kitabxanası - Oxucu Autentifikasiyası Xidməti (Reader Auth Service)
 * 
 * Bu xidmət oxucuların qeydiyyatı, şifrə heşlənməsi, daxil olma yoxlaması
 * və sessiya idarəçiliyini təmin edir.
 */

import {
  Reader,
  ReaderCategory,
  getReaders,
  createReader,
  getReaderByEmail,
  getReaderByTicketNumber,
  generateNextTicketNumber,
} from "./circulation-service";
import { recordMutationLog } from "./sync-service";

export interface RegisterReaderInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  category: ReaderCategory;
  department: string; // Tələbə: Qrup/İxtisas; Müəllim/Əməkdaş: Kafedra/Şöbə
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  reader?: Reader;
  ticketNumber?: string;
}

export const AUTH_STORAGE_KEY = "libra_ai_current_reader";

function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Təhlükəsiz SHA-256 heşləmə funksiyası (Web Crypto API)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = "libra_ai_secure_salt_2026_";
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Universal fallback
  let hash = 0;
  for (let i = 0; i < (salt + password).length; i++) {
    const char = (salt + password).charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(16);
}

/**
 * Şifrənin heşlə müqayisəsi
 */
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const candidateHash = await hashPassword(password);
  return candidateHash === hashed;
}

/**
 * Ad və Soyadın ayrılması
 */
function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "-" };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

/**
 * Oxucunun Qeydiyyatı (Register)
 */
export async function registerReader(input: RegisterReaderInput): Promise<AuthResponse> {
  const trimmedName = input.fullName?.trim() || "";
  const trimmedPhone = input.phone?.trim() || "";
  const trimmedEmail = input.email?.trim().toLowerCase() || "";
  const trimmedDept = input.department?.trim() || "";
  const password = input.password || "";
  const confirmPassword = input.confirmPassword || "";

  // 1. Ad və Soyad yoxlanışı (minimum 3 simvol)
  if (trimmedName.length < 3) {
    return {
      success: false,
      error: "Ad və Soyad ən azı 3 simvoldan ibarət olmalıdır.",
    };
  }

  // 2. Əlaqə nömrəsi yoxlanışı
  if (!trimmedPhone || trimmedPhone.length < 9) {
    return {
      success: false,
      error: "Zəhmət olmasa düzgün əlaqə nömrəsi qeyd edin (məs: +994 50 123 45 67).",
    };
  }

  // 3. E-poçt formatı yoxlanışı
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      success: false,
      error: "Düzgün e-poçt ünvanı daxil edin (məs: oxucu@ldptm.edu.az).",
    };
  }

  // 4. E-poçt unikal olmalıdır
  const existingEmail = await getReaderByEmail(trimmedEmail);
  if (existingEmail) {
    return {
      success: false,
      error: "Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib.",
    };
  }

  // 5. Şifrə uzunluğu yoxlanışı (minimum 6 simvol)
  if (password.length < 6) {
    return {
      success: false,
      error: "Şifrə ən azı 6 simvoldan ibarət olmalıdır.",
    };
  }

  // 6. Şifrə təkrarı uyğunluğu
  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Daxil edilən şifrələr bir-biri ilə uyğun gəlmir.",
    };
  }

  // 7. Departament / Qrup sahəsi
  if (!trimmedDept) {
    return {
      success: false,
      error:
        input.category === "Tələbə"
          ? "Zəhmət olmasa Qrup və ya İxtisas sahəsini qeyd edin."
          : "Zəhmət olmasa Kafedra və ya Şöbənizi qeyd edin.",
    };
  }

  try {
    // Unikal Oxucu Bilet Nömrəsi generasiya et
    const ticketNumber = await generateNextTicketNumber();

    // Şifrəni heşlə
    const hashedPassword = await hashPassword(password);

    const { firstName, lastName } = parseFullName(trimmedName);

    // Oxucunu bazaya / localStorage-a yaz
    const newReader = await createReader({
      ticketNumber,
      firstName,
      lastName,
      category: input.category || "Tələbə",
      role: input.category === "Müəllim" ? "teacher" : input.category === "Əməkdaş" ? "staff" : "student",
      accessRole: "reader",
      department: trimmedDept,
      phone: trimmedPhone,
      email: trimmedEmail,
      password: hashedPassword,
      maxBookLimit: input.category === "Müəllim" || input.category === "Əməkdaş" ? 10 : 5,
      status: "pending", // Hybrid registration: starts as pending approval
      notes: "Onlayn portal vasitəsilə qeydiyyatdan keçib (Təsdiq gözləyir)",
    });

    // Sinxronizasiya loguna yaz
    recordMutationLog(
      "Yeni oxucu",
      `${trimmedName} (${ticketNumber} - Təsdiq gözləyir)`,
      "Uğurlu"
    );

    return {
      success: true,
      message: "Qeydiyyat tamamlandı! Hesabınız kitabxanaçı təsdiqindən sonra aktivləşəcək.",
      reader: newReader,
      ticketNumber,
    };
  } catch (err: any) {
    console.error("Qeydiyyat zamanı xəta:", err);
    return {
      success: false,
      error: err?.message || "Qeydiyyat zamanı gözlənilməz xəta baş verdi.",
    };
  }
}

/**
 * Oxucunun Girişi (Login)
 */
export async function loginReader(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const trimmedId = identifier?.trim() || "";
  const trimmedPass = password || "";

  if (!trimmedId) {
    return {
      success: false,
      error: "E-poçt ünvanınızı daxil edin.",
    };
  }

  if (!trimmedPass || trimmedPass.length < 6) {
    return {
      success: false,
      error: "E-poçt və ya şifrə yanlışdır",
    };
  }

  // 1. Oxucunu axtar: E-poçt və ya Bilet №
  let reader: Reader | null = null;
  if (trimmedId.includes("@")) {
    reader = await getReaderByEmail(trimmedId);
  } else {
    reader = await getReaderByTicketNumber(trimmedId);
  }

  // Əgər tapılmadısa, hər ikisi ilə təkrar yoxla
  if (!reader) {
    const allReaders = await getReaders();
    reader =
      allReaders.find(
        (r) =>
          r.email?.toLowerCase() === trimmedId.toLowerCase() ||
          r.ticketNumber?.toUpperCase() === trimmedId.toUpperCase()
      ) || null;
  }

  if (!reader) {
    return {
      success: false,
      error: "E-poçt və ya şifrə yanlışdır",
    };
  }

  // 2. Status yoxlanışı
  if (reader.status === "Bloklanıb") {
    return {
      success: false,
      error: "Hesabınız bloklanıb. Zəhmət olmasa kitabxanaçı ilə əlaqə saxlayın.",
    };
  }

  // 3. Şifrə yoxlanışı
  if (reader.password) {
    const isValid = await verifyPassword(trimmedPass, reader.password);
    if (!isValid) {
      return {
        success: false,
        error: "E-poçt və ya şifrə yanlışdır",
      };
    }
  } else {
    // Əgər oxucu administrator tərəfindən şifrəsiz əlavə olunubsa,
    // ilk girişdə şifrəni avtomatik onun üçün qeyd edirik
    const hashedPassword = await hashPassword(trimmedPass);
    reader.password = hashedPassword;
  }

  // Sessiyanı yadda saxla
  if (isClient()) {
    try {
      const sessionReader = { ...reader };
      delete sessionReader.password; // Təhlükəsizlik üçün şifrə sessiyada saxlanmır
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionReader));
      window.dispatchEvent(new CustomEvent("libra-auth-changed"));
    } catch (err) {
      console.error("Sessiya saxlanarkən xəta:", err);
    }
  }

  return {
    success: true,
    message: "Xoş gəlmisiniz!",
    reader,
    ticketNumber: reader.ticketNumber,
  };
}

/**
 * Cari daxil olmuş oxucunun məlumatlarını əldə etmək
 */
export function getCurrentReader(): Reader | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Oxucunun çıxışı (Logout)
 */
export function logoutReader(): void {
  if (isClient()) {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("libra-auth-changed"));
    } catch (err) {
      console.error("Çıxış zamanı xəta:", err);
    }
  }
}

/**
 * İstifadəçinin daxil olub-olmadığını yoxlayır
 */
export function isAuthenticated(): boolean {
  return getCurrentReader() !== null;
}

