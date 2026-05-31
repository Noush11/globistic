import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { ok, handleError, fail } from "@/lib/api";
import { sendPasswordReset } from "@/lib/email";
import { env } from "@/lib/env";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(clientKey(req, "forgot"), 5, 60_000);
    if (!limit.success) return fail("Too many attempts. Please try again later.", 429);

    const { email } = forgotPasswordSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always respond success to avoid leaking which emails exist.
    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
      });
      await sendPasswordReset({
        to: user.email,
        resetUrl: `${env.appUrl}/reset-password?token=${token}`
      });
    }

    return ok({ sent: true });
  } catch (error) {
    return handleError(error);
  }
}
