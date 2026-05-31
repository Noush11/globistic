import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { ok, fail, handleError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(clientKey(req, "register"), 5, 60_000);
    if (!limit.success) return fail("Too many attempts. Please try again later.", 429);

    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return fail("An account with that email already exists.", 409);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        phone: data.phone,
        passwordHash: await hashPassword(data.password)
      }
    });

    const token = await createSession({ sub: user.id, email: user.email, role: user.role, name: user.name });
    setAuthCookie(token);

    return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
