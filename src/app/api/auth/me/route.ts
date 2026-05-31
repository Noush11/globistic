import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ok({ user: null });
  return ok({ user: { id: user.sub, email: user.email, name: user.name, role: user.role } });
}
