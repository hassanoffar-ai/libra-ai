import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.reader) {
      return NextResponse.json({ error: "Oxucu məlumatı tapılmadı." }, { status: 400 });
    }

    const cookieStore = cookies();
    const isProd = process.env.NODE_ENV === "production";
    const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 gün

    cookieStore.set("libra_reader_session", JSON.stringify(body.reader), {
      maxAge: expiresIn / 1000,
      httpOnly: false, // Accessible to client reader hooks
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Xəta baş verdi" }, { status: 500 });
  }
}

