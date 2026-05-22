import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_token";
const SESSION_DURATION = 60 * 60; // 1 hour

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export async function setSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  return token?.value === "authenticated";
}

export async function requireAuth(req: NextRequest): Promise<boolean> {
  // For API routes, we check cookies on the request
  const token = req.cookies.get(COOKIE_NAME);
  return token?.value === "authenticated";
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
