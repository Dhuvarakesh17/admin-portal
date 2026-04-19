import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { APP_ROUTES, SESSION_COOKIE } from "@/lib/constants";

const encoder = new TextEncoder();

async function isValidSession(token: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, encoder.encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");
  const isPublicRoute =
    pathname === APP_ROUTES.login || pathname.startsWith("/api/auth");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = token ? await isValidSession(token) : false;

  if (!isPublicRoute && !authenticated) {
    if (isApiRoute) {
      return NextResponse.json(
        { ok: false, error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const loginUrl = new URL(APP_ROUTES.login, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/" && authenticated) {
    return NextResponse.redirect(new URL(APP_ROUTES.dashboard, request.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
