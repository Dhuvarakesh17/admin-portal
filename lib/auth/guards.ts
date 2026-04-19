import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { APP_ROUTES } from "@/lib/constants";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect(APP_ROUTES.login);
  }
  return session;
}

export async function requireRole() {
  return requireSession();
}
