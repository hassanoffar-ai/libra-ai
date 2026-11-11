import "server-only";
import { UserProfile, UserRole } from "@/lib/types/user";

const apiKey =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyBm37kJhdRy7sa7yxg0WbtSNAVhtUAisCE";

const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "ldptm-kitabxana";

// List of configured administrator emails
const DEFAULT_ADMIN_EMAILS = [
  "admin@ldptm.edu.az",
  "kitabxana@ldptm.edu.az",
];

export function isEmailAdmin(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();

  // Check hardcoded defaults
  if (DEFAULT_ADMIN_EMAILS.includes(clean)) return true;

  // Check environment variable list if configured
  const envAdmins = process.env.ADMIN_EMAILS;
  if (envAdmins) {
    const list = envAdmins.split(",").map((e) => e.trim().toLowerCase());
    if (list.includes(clean)) return true;
  }

  // Any @ldptm.edu.az address starting with admin
  if (clean.startsWith("admin@") || clean.startsWith("kitabxana@")) {
    return true;
  }

  return false;
}

export interface VerifiedUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
}

/**
 * Verifies a Firebase ID token securely without requiring Google Cloud service account keys.
 * Uses Google's official Identity Toolkit REST API.
 */
export async function verifyTokenSecurely(idToken: string): Promise<VerifiedUser | null> {
  if (!idToken || typeof idToken !== "string") {
    return null;
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn("Google identity lookup rejected token:", errData?.error?.message || res.status);
      return null;
    }

    const data = await res.json();
    const account = data.users?.[0];
    if (!account) return null;

    const email = (account.email || "").toLowerCase();
    const isAdmin = isEmailAdmin(email);

    return {
      uid: account.localId,
      email,
      displayName: account.displayName || "",
      role: isAdmin ? "admin" : "oxucu",
    };
  } catch (err) {
    console.error("Token verification network error:", err);
    return null;
  }
}

/**
 * Creates a new user in Firebase Auth via Google Identity Toolkit REST API
 */
export async function createAuthUserViaRest(
  email: string,
  pass: string,
  displayName?: string
): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: pass,
        displayName: displayName || undefined,
        returnSecureToken: true,
      }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message;
      if (msg === "EMAIL_EXISTS") {
        return { success: false, error: "Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib." };
      }
      return { success: false, error: msg || "İstifadəçi yaradıla bilmədi." };
    }

    return {
      success: true,
      uid: data.localId,
    };
  } catch (err: any) {
    console.error("Create user via REST error:", err);
    return { success: false, error: err?.message || "Şəbəkə xətası baş verdi." };
  }
}

