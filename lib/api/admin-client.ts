import { ApiClientError } from "@/lib/api/errors";

function getBaseUrl() {
  const value =
    process.env.JB_PORTAL_ADMIN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://creinx-careers.vercel.app"
      : "http://localhost:3000");

  return value;
}

function getApiKey() {
  const value = process.env.JB_PORTAL_ADMIN_API_KEY;
  if (!value) {
    throw new ApiClientError("Missing JB_PORTAL_ADMIN_API_KEY", 500);
  }
  return value;
}

export async function adminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-admin-api-key": getApiKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiClientError(
      payload?.error?.message ??
        payload?.message ??
        "Admin backend request failed",
      response.status,
      payload,
    );
  }

  return (payload.data ?? payload) as T;
}
