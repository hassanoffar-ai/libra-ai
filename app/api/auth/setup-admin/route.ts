import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/types/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone, secretKey } = body;

    // Security check: Must supply the server-side secret key from environment variables
    const serverSecret = process.env.ADMIN_SETUP_SECRET;
    
    // If ADMIN_SETUP_SECRET is configured, it must match
    if (serverSecret && secretKey !== serverSecret) {
      return NextResponse.json(
        { error: "İcazə verilmədi: Administrator açarı yanlışdır." },
        { status: 403 }
      );
    }

    // If ADMIN_SETUP_SECRET is not configured, allow setup only if no admin exists yet
    if (!serverSecret) {
      const existingAdmins = await adminDb
        .collection("users")
        .where("role", "==", "admin")
        .limit(1)
        .get();

      if (!existingAdmins.empty) {
        return NextResponse.json(
          { error: "Sistemdə artıq aktiv administrator mövcuddur. Təhlükəsizlik üçün ADMIN_SETUP_SECRET tələb olunur." },
          { status: 403 }
        );
      }
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanFirst = (firstName || "Admin").trim();
    const cleanLast = (lastName || "İstifadəçi").trim();
    const cleanPhone = (phone || "+994 50 000 00 00").trim();

    if (!cleanEmail || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Düzgün e-poçt və minimum 6 simvollu şifrə tələb olunur." },
        { status: 400 }
      );
    }

    // 1. Create or get user in Firebase Auth
    let uid = "";
    try {
      const existingUser = await adminAuth.getUserByEmail(cleanEmail);
      uid = existingUser.uid;
      // Update password if provided
      await adminAuth.updateUser(uid, {
        password,
        displayName: `${cleanFirst} ${cleanLast}`,
      });
    } catch {
      const newUser = await adminAuth.createUser({
        email: cleanEmail,
        password,
        displayName: `${cleanFirst} ${cleanLast}`,
      });
      uid = newUser.uid;
    }

    // 2. Set Custom User Claims to { role: "admin" }
    await adminAuth.setCustomUserClaims(uid, {
      role: "admin",
    });

    const now = new Date().toISOString();
    const adminProfile: UserProfile = {
      uid,
      email: cleanEmail,
      role: "admin", // Admin role strictly assigned here
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      category: "Müəllim",
      status: "Aktiv",
      createdAt: now,
      updatedAt: now,
    };

    // 3. Save admin profile in Firestore
    await adminDb.collection("users").doc(uid).set(adminProfile, { merge: true });

    return NextResponse.json({
      success: true,
      message: `Admin hesabı (${cleanEmail}) uğurla yaradıldı və təsdiqləndi.`,
      uid,
    });
  } catch (err: any) {
    console.error("Admin setup error:", err);
    return NextResponse.json(
      { error: err?.message || "Admin yaradılarkən xəta baş verdi." },
      { status: 500 }
    );
  }
}

