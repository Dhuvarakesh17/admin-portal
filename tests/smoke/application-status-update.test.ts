import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSessionMock = vi.fn();
const requireMutationProtectionMock = vi.fn();
const updateApplicationStatusMock = vi.fn();

vi.mock("@/lib/storage/applications-store", () => ({
  updateApplicationStatus: (...args: unknown[]) =>
    updateApplicationStatusMock(...args),
}));

vi.mock("@/lib/api/route-guards", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSessionMock(...args),
  requireMutationProtection: (...args: unknown[]) =>
    requireMutationProtectionMock(...args),
}));

describe("application status route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSessionMock.mockResolvedValue({
      ok: true,
      user: {
        id: "u1",
        email: "admin@test.com",
        name: "Admin",
        role: "admin",
      },
    });
    requireMutationProtectionMock.mockResolvedValue(null);
  });

  it("updates application status", async () => {
    updateApplicationStatusMock.mockResolvedValueOnce({
      id: "a1",
      status: "shortlisted",
    });
    const route = await import("@/app/api/applications/[id]/status/route");

    const request = new Request(
      "http://localhost:3000/api/applications/a1/status",
      {
        method: "POST",
        body: JSON.stringify({
          status: "shortlisted",
          note: "Strong portfolio",
        }),
      },
    );

    const response = await route.POST(request, {
      params: Promise.resolve({ id: "a1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(updateApplicationStatusMock).toHaveBeenCalledWith(
      "a1",
      expect.objectContaining({ status: "shortlisted" }),
      "admin@test.com",
    );
  });
});
