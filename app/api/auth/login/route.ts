import { fail, ok } from "@/lib/api/response";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid credentials payload", 400, parsed.error.flatten());
    }

    const simpleLoginEmail = process.env.ADMIN_SIMPLE_LOGIN_EMAIL?.trim();
    const simpleLoginPassword = process.env.ADMIN_SIMPLE_LOGIN_PASSWORD;
    const simpleLoginName =
      process.env.ADMIN_SIMPLE_LOGIN_NAME?.trim() || "Admin";

    if (!simpleLoginEmail || !simpleLoginPassword) {
      return fail(
        "Simple admin login is not configured. Set ADMIN_SIMPLE_LOGIN_EMAIL and ADMIN_SIMPLE_LOGIN_PASSWORD.",
        500,
      );
    }

    if (
      parsed.data.email !== simpleLoginEmail ||
      parsed.data.password !== simpleLoginPassword
    ) {
      return fail("Invalid email or password", 401);
    }

    const user = {
      id: "local-admin",
      name: simpleLoginName,
      email: simpleLoginEmail,
      role: "admin",
    } as const;

    await createSession(user);
    return ok({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process login";
    return fail(message, 500);
  }
}
