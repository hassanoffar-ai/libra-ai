import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyTokenSecurely,
  getUserProfileViaRest,
  saveUserProfileViaRest,
  isEmailAdmin,
} from "@/lib/firebase/server-auth";
import { UserProfile, UserRole } from "@/lib/types/user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.idToken) {
      return NextResponse.json(
        { error: "Autentifikasiya tokeni tapılmadı." },
        { status: 400 }
      );
    }

    const { idToken, requestedPortal } = body;

    // 1. Verify token securely via Google Identity Toolkit REST API
    const verifiedUser = await verifyTokenSecurely(idToken);
    if (!verifiedUser) {
      return NextResponse.json(
        { error: "Autentifikasiya sessiyası yaradılarkən xəta: Token etibarsızdır və ya müddəti bitib." },
        { status: 401 }
      );
    }

    const uid = verifiedUser.uid;
    const email = verifiedUser.email;

    // 2. Fetch real user profile from Firestore to get their real category and details
    const firestoreProfile = await getUserProfileViaRest(idToken, uid);

    // Determine role securely:
    // If admin by email or custom claims or Firestore role
    let role: UserRole = "oxucu";
    if (isEmailAdmin(email) || verifiedUser.role === "admin" || firestoreProfile?.role === "admin") {
      role = "admin";
    }

    // 3. Strict Server-Side Portal Permission Check:
    // If logging into the /admin portal, strictly verify role is admin
    if (requestedPortal === "admin" && role !== "admin") {
      return NextResponse.json(
        {
          error: "Giriş icazəsi yoxdur. Bu portal yalnız kitabxana administratorları üçündür.",
          role,
        },
        { status: 403 }
      );
    }

    // 4. Set Session Cookies (expires in 5 days)
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const isProd = process.env.NODE_ENV === "production";
    const cookieStore = cookies();

    cookieStore.set("libra_session", idToken, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("libra_role", role, {
      maxAge: expiresIn / 1000,
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    // 5. Build full user profile, respecting their selected category (Müəllim / Tələbə)
    const category: "Tələbə" | "Müəllim" =
      firestoreProfile?.category === "Müəllim" || (role === "admin" && !firestoreProfile?.category)
        ? "Müəllim"
        : "Tələbə";

    const userProfile: UserProfile = {
      uid,
      email,
      role,
      category,
      firstName:
        firestoreProfile?.firstName ||
        verifiedUser.displayName?.split(" ")[0] ||
        (role === "admin" ? "Admin" : "Oxucu"),
      lastName:
        firestoreProfile?.lastName ||
        verifiedUser.displayName?.split(" ").slice(1).join(" ") ||
        "",
      phone: firestoreProfile?.phone || "",
      ticketNumber: firestoreProfile?.ticketNumber || (role === "admin" ? "ADM-001" : `OX-${Math.floor(1000 + Math.random() * 9000)}`),
      status: firestoreProfile?.status || "Aktiv",
      createdAt: firestoreProfile?.createdAt || new Date().toISOString(),
      updatedAt: firestoreProfile?.updatedAt || new Date().toISOString(),
    };

    // If document didn't exist in Firestore (for previously registered users), safely heal/create it now
    if (!firestoreProfile && role === "oxucu") {
      await saveUserProfileViaRest(idToken, uid, userProfile).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      user: userProfile,
    });
  } catch (err: any) {
    console.error("Session creation error:", err);
    return NextResponse.json(
      { error: "Autentifikasiya sessiyası yaradılarkən xəta: " + (err?.message || "Gözlənilməz xəta") },
      { status: 500 }
    );
  }
}
