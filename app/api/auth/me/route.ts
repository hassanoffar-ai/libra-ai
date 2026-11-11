import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/types/user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("libra_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false, error: "Aktiv sessiya tapılmadı." },
        { status: 401 }
      );
    }

    let uid = "";
    let email = "";
    let role: "admin" | "oxucu" = "oxucu";

    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      uid = decodedClaims.uid;
      email = decodedClaims.email || "";
      if (decodedClaims.role === "admin") role = "admin";
    } catch {
      // In case sessionCookie was an ID token
      try {
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        uid = decodedToken.uid;
        email = decodedToken.email || "";
        if (decodedToken.role === "admin") role = "admin";
      } catch (e) {
        return NextResponse.json(
          { authenticated: false, error: "Sessiya müddəti bitib." },
          { status: 401 }
        );
      }
    }

    // Fetch user profile from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    let profileData: Partial<UserProfile> = {};
    if (userDoc.exists) {
      profileData = userDoc.data() as UserProfile;
      if (profileData.role === "admin") role = "admin";
    }

    const user: UserProfile = {
      uid,
      email: email || profileData.email || "",
      role,
      firstName: profileData.firstName || "İstifadəçi",
      lastName: profileData.lastName || "",
      phone: profileData.phone || "",
      category: profileData.category || "Tələbə",
      ticketNumber: profileData.ticketNumber,
      status: profileData.status || "Aktiv",
      createdAt: profileData.createdAt || new Date().toISOString(),
      updatedAt: profileData.updatedAt || new Date().toISOString(),
    };

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (err: any) {
    console.error("Auth me check error:", err);
    return NextResponse.json(
      { authenticated: false, error: "Autentifikasiya yoxlanışı xətası" },
      { status: 500 }
    );
  }
}

