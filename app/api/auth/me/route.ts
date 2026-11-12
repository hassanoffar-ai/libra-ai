import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyTokenSecurely,
  getUserProfileViaRest,
  isEmailAdmin,
} from "@/lib/firebase/server-auth";
import { UserProfile, UserRole } from "@/lib/types/user";

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

    const verifiedUser = await verifyTokenSecurely(sessionCookie);
    if (!verifiedUser) {
      return NextResponse.json(
        { authenticated: false, error: "Sessiya müddəti bitib." },
        { status: 401 }
      );
    }

    const uid = verifiedUser.uid;
    const email = verifiedUser.email;

    // Fetch user profile from Firestore to get their real category and details
    const firestoreProfile = await getUserProfileViaRest(sessionCookie, uid);

    let role: UserRole = "oxucu";
    if (isEmailAdmin(email) || verifiedUser.role === "admin" || firestoreProfile?.role === "admin") {
      role = "admin";
    }

    const category: "Tələbə" | "Müəllim" =
      firestoreProfile?.category === "Müəllim"
        ? "Müəllim"
        : (role === "admin" ? "Müəllim" : "Tələbə");

    const firstName =
      firestoreProfile?.firstName ||
      verifiedUser.displayName?.split(" ")[0] ||
      (role === "admin" ? "Administrator" : "Oxucu");

    const lastName =
      firestoreProfile?.lastName ||
      verifiedUser.displayName?.split(" ").slice(1).join(" ") ||
      "";

    const user: UserProfile = {
      uid,
      email,
      role,
      accessRole: role === "admin" ? "librarian" : "reader",
      category,
      categoryRole: category === "Müəllim" ? "teacher" : "student",
      firstName,
      lastName,
      phone: firestoreProfile?.phone || "",
      department: firestoreProfile?.department || "",
      ticketNumber: firestoreProfile?.ticketNumber || "",
      status: firestoreProfile?.status || (role === "admin" ? "active" : "pending"),
      createdAt: firestoreProfile?.createdAt || new Date().toISOString(),
      updatedAt: firestoreProfile?.updatedAt || new Date().toISOString(),
    };

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (err: any) {
    console.error("Auth me error:", err);
    return NextResponse.json(
      { authenticated: false, error: "Sessiya yoxlanışı xətası." },
      { status: 500 }
    );
  }
}
