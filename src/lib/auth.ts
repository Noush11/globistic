import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, verifyToken, type JwtPayload } from "./jwt";
import type { Role } from "@prisma/client";

export const AUTH_COOKIE = "globistic_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: JwtPayload): Promise<string> {
  return signToken(payload);
}

// Set the auth cookie (httpOnly) — call from route handlers / server actions.
export function setAuthCookie(token: string) {
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export function clearAuthCookie() {
  cookies().set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// Read the current user from cookies (server components & route handlers).
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Read the current user from an incoming request (route handlers / middleware).
export async function getUserFromRequest(req: NextRequest): Promise<JwtPayload | null> {
  const cookieToken = req.cookies.get(AUTH_COOKIE)?.value;
  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = cookieToken || bearer;
  if (!token) return null;
  return verifyToken(token);
}

export function hasRole(user: JwtPayload | null, roles: Role[]): boolean {
  return !!user && roles.includes(user.role);
}

export function isAdmin(user: JwtPayload | null): boolean {
  return hasRole(user, ["ADMIN", "SUPER_ADMIN"]);
}
