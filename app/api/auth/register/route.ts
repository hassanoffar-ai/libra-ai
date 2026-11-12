import { NextRequest, NextResponse } from "next/server";
import { createAuthUserViaRest, saveUserProfileViaRest } from "@/lib/firebase/server-auth";
import { UserProfile } from "@/lib/types/user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      category,
      password,
      confirmPassword,
    } = body;

    // 1. Validation
    const cleanFirst = (firstName || "").trim();
    const cleanLast = (lastName || "").trim();
    const cleanPhone = (phone || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    
    // Explicitly validate user category: STRICTLY "Müəllim" or "Tələbə"
    const cleanCategory: "Tələbə" | "Müəllim" = category === "Müəllim" ? "Müəllim" : "Tələbə";

    if (!cleanFirst || cleanFirst.length < 2) {
      return NextResponse.json(
        { error: "Ad minimum 2 simvoldan ibarət olmalıdır." },
        { status: 400 }
      );
    }

    if (!cleanLast || cleanLast.length < 2) {
      return NextResponse.json(
        { error: "Soyad minimum 2 simvoldan ibarət olmalıdır." },
        { status: 400 }
      );
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      return NextResponse.json(
        { error: "Düzgün mobil telefon nömrəsi daxil edin (məs: +994 50 123 45 67)." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Düzgün e-poçt formatı daxil edin." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Şifrə minimum 6 simvoldan ibarət olmalıdır." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Şifrə və şifrənin təkrarı bir-biri ilə uyğun gəlmir." },
        { status: 400 }
      );
    }

    // 2. Create user in Firebase Authentication via Google Identity Toolkit
    const createRes = await createAuthUserViaRest(
      cleanEmail,
      password,
      `${cleanFirst} ${cleanLast}`
    );

    if (!createRes.success || !createRes.uid) {
      return NextResponse.json(
        { error: createRes.error || "Qeydiyyat zamanı xəta baş verdi." },
        { status: 400 }
      );
    }

    const ticketNumber = `OX-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const userProfile: UserProfile = {
      uid: createRes.uid,
      email: cleanEmail,
      role: "oxucu", // STRICTLY Oxucu - cannot escalate to admin
      category: cleanCategory, // Saved correctly as Müəllim or Tələbə
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      ticketNumber,
      status: "Aktiv",
      createdAt: now,
      updatedAt: now,
    };

    // 3. Save profile directly to Firestore using the returned ID token
    if (createRes.idToken) {
      await saveUserProfileViaRest(createRes.idToken, createRes.uid, userProfile);
    }

    return NextResponse.json({
      success: true,
      message: "Qeydiyyat uğurla tamamlandı! Giriş edə bilərsiniz.",
      ticketNumber,
      uid: createRes.uid,
      user: userProfile,
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err?.message || "Qeydiyyat zamanı xəta baş verdi." },
      { status: 500 }
    );
  }
}
