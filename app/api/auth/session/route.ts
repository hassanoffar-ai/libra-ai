import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/types/user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { idToken, requestedPortal } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "Autentifikasiya tokeni tapılmadı." },
        { status: 400 }
      );
    }

    // 1. Verify Firebase ID Token on the server
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    const uid = decodedToken.uid;

    // 2. Fetch user profile from Firestore to confirm role
    let role: "admin" | "oxucu" = "oxucu";
    let profileData: Partial<UserProfile> = {};

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (userDoc.exists) {
      profileData = userDoc.data() as UserProfile;
      role = (profileData.role === "admin" || decodedToken.role === "admin") ? "admin" : "oxucu";
    } else if (decodedToken.role === "admin") {
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

    // 4. Create Session Cookie (expires in 5 days)
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    let sessionCookie = "";

    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    } catch (sessionErr) {
      // Fallback: use verified token if createSessionCookie is unavailable in local dev
      sessionCookie = idToken;
    }

    // 5. Set HttpOnly, Secure, SameSite Session Cookie
    const isProd = process.env.NODE_ENV === "production";
    const cookieStore = cookies();

    cookieStore.set("libra_session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("libra_role", role, {
      maxAge: expiresIn / 1000,
      httpOnly: false, // Accessible to client-side auth state
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    const userProfile: UserProfile = {
      uid,
      email: decodedToken.email || profileData.email || "",
      role,
      firstName: profileData.firstName || decodedToken.name?.split(" ")[0] || "İstifadəçi",
      lastName: profileData.lastName || decodedToken.name?.split(" ").slice(1).join(" ") || "",
      phone: profileData.phone || "",
      category: profileData.category || "Tələbə",
      ticketNumber: profileData.ticketNumber,
      status: profileData.status || "Aktiv",
      createdAt: profileData.createdAt || new Date().toISOString(),
      updatedAt: profileData.updatedAt || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
    });
  } catch (err: any) {
    console.error("Session creation error:", err);
    return NextResponse.json(
      { error: "Autentifikasiya sessiyası yaradılarkən xəta: " + (err?.message || "Token etibarsızdır") },
      { status: 401 }
    );
  }
}

