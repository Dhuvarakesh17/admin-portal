"use client";

function getCookieValue(name: string) {
  const tokens = document.cookie.split(";").map((part) => part.trim());
  const found = tokens.find((token) => token.startsWith(`${name}=`));
  return found?.split("=")[1];
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? "GET";
  const csrf = getCookieValue("jb_admin_csrf");

  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(method === "GET" || method === "HEAD"
        ? {}
        : { "x-csrf-token": csrf ?? "" }),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload?.error?.message ?? "Request failed");
  }

  return payload.data as T;
}
