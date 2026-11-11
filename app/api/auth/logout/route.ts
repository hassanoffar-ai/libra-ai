import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("libra_session");
  cookieStore.delete("libra_role");

  return NextResponse.json({
    success: true,
    message: "Uğurla çıxış edildi.",
  });
}

