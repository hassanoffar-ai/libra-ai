import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    cookieStore.set("libra_reader_session", "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Xəta baş verdi" }, { status: 500 });
  }
}

