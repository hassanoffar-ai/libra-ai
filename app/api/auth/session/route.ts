import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyTokenSecurely } from "@/lib/firebase/server-auth";
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
    const role: UserRole = verifiedUser.role;

    // 2. Strict Server-Side Portal Permission Check:
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

    // 3. Set Session Cookies (expires in 5 days)
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

    const userProfile: UserProfile = {
      uid,
      email,
      role,
      firstName: verifiedUser.displayName?.split(" ")[0] || (role === "admin" ? "Admin" : "Oxucu"),
      lastName: verifiedUser.displayName?.split(" ").slice(1).join(" ") || "",
      phone: "",
      category: role === "admin" ? "Müəllim" : "Tələbə",
      status: "Aktiv",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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
