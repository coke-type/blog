import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword, setSession, clearSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password, action } = await req.json();

  if (action === "logout") {
    await clearSession();
    return NextResponse.json({ ok: true });
  }

  if (password === getAdminPassword()) {
    await setSession();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 });
}
