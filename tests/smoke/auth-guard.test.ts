import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const verifyMock = vi.fn();

vi.mock("jose", () => ({
  jwtVerify: (...args: unknown[]) => verifyMock(...args),
}));

describe("auth guard middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_SESSION_SECRET = "test-secret";
  });

  it("redirects to login for protected routes without session", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/dashboard");

    const response = await proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("allows public login route", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/login");

    const response = await proxy(request);
    expect(response.status).toBe(200);
  });

  it("allows authenticated route with valid token", async () => {
    verifyMock.mockResolvedValueOnce({});
    const { proxy } = await import("@/proxy");

    const request = new NextRequest("http://localhost:3000/dashboard", {
      headers: { cookie: "jb_admin_session=fake-token" },
    });

    const response = await proxy(request);
    expect(response.status).toBe(200);
  });
});
