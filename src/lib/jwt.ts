import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";
import type { Role } from "@prisma/client";

const secret = new TextEncoder().encode(env.jwtSecret);

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
  name?: string | null;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.jwtExpiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
