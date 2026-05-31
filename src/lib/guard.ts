import { NextRequest } from "next/server";
import { getUserFromRequest, isAdmin } from "./auth";
import type { JwtPayload } from "./jwt";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Throws HttpError (caught by handleError) if the caller isn't an admin.
export async function requireAdmin(req: NextRequest): Promise<JwtPayload> {
  const user = await getUserFromRequest(req);
  if (!user) throw new HttpError(401, "Authentication required");
  if (!isAdmin(user)) throw new HttpError(403, "Admin access required");
  return user;
}

export async function requireUser(req: NextRequest): Promise<JwtPayload> {
  const user = await getUserFromRequest(req);
  if (!user) throw new HttpError(401, "Authentication required");
  return user;
}
