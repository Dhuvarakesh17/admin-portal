import { fail } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import type { SessionUser, UserRole } from "@/lib/types/models";

export async function requireApiSession(
  allowed?: UserRole[],
): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: Response }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: fail("Unauthorized", 401) };
  }

  if (allowed && !allowed.includes(session.role)) {
    return { ok: false, response: fail("Forbidden", 403) };
  }

  return { ok: true, user: session };
}

export async function requireMutationProtection(request: Request) {
  return null;
}
