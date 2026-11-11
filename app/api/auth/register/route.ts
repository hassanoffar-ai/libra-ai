import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/types/user";

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
    const cleanCategory = category === "Müəllim" ? "Müəllim" : "Tələbə";

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

    // 2. Check if user already exists in Firebase Auth or Firestore
    try {
      const existingUser = await adminAuth.getUserByEmail(cleanEmail);
      if (existingUser) {
        return NextResponse.json(
          { error: "Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib." },
          { status: 400 }
        );
      }
    } catch (err: any) {
      // If user not found, getUserByEmail throws auth/user-not-found - which is expected
      if (err.code !== "auth/user-not-found") {
        console.error("User lookup error:", err);
      }
    }

    // 3. Create user in Firebase Authentication
    // Note: Password is securely managed by Firebase Auth and NEVER stored in plaintext or in Firestore.
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      password: password,
      displayName: `${cleanFirst} ${cleanLast}`,
    });

    // 4. Set custom user claims - strictly "oxucu"
    // Client has ZERO ability to assign Admin role
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: "oxucu",
    });

    // 5. Generate unique Ticket Number for reader
    let ticketNumber = "OX-1001";
    try {
      const countSnapshot = await adminDb.collection("users").count().get();
      const nextNum = 1000 + countSnapshot.data().count + 1;
      ticketNumber = `OX-${nextNum}`;
    } catch (e) {
      // Fallback ticket generator
      ticketNumber = `OX-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const now = new Date().toISOString();
    const userProfile: UserProfile = {
      uid: userRecord.uid,
      email: cleanEmail,
      role: "oxucu", // STRICTLY oxucu
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      category: cleanCategory,
      ticketNumber,
      status: "Aktiv",
      createdAt: now,
      updatedAt: now,
    };

    // 6. Save reader profile in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set(userProfile);

    return NextResponse.json({
      success: true,
      message: "Qeydiyyat uğurla tamamlandı! Giriş edə bilərsiniz.",
      ticketNumber,
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    if (err.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err?.message || "Qeydiyyat zamanı xəta baş verdi." },
      { status: 500 }
    );
  }
}

