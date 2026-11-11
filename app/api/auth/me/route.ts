import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyTokenSecurely } from "@/lib/firebase/server-auth";
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

    const verifiedUser = await verifyTokenSecurely(sessionCookie);
    if (!verifiedUser) {
      return NextResponse.json(
        { authenticated: false, error: "Sessiya müddəti bitib." },
        { status: 401 }
      );
    }

    const user: UserProfile = {
      uid: verifiedUser.uid,
      email: verifiedUser.email,
      role: verifiedUser.role,
      firstName: verifiedUser.displayName?.split(" ")[0] || (verifiedUser.role === "admin" ? "Admin" : "Oxucu"),
      lastName: verifiedUser.displayName?.split(" ").slice(1).join(" ") || "",
      phone: "",
      category: verifiedUser.role === "admin" ? "Müəllim" : "Tələbə",
      status: "Aktiv",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
