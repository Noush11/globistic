import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { ok, fail, handleError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(clientKey(req, "login"), 10, 60_000);
    if (!limit.success) return fail("Too many attempts. Please try again later.", 429);

    const { email, password } = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail("Invalid email or password.", 401);
    }

    const token = await createSession({ sub: user.id, email: user.email, role: user.role, name: user.name });
    setAuthCookie(token);

    return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    return handleError(error);
  }
}
