import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetJobsStore } from "@/lib/storage/jobs-store";

const requireApiSessionMock = vi.fn();

vi.mock("@/lib/api/route-guards", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSessionMock(...args),
}));

describe("jobs CRUD route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetJobsStore();
    requireApiSessionMock.mockResolvedValue({
      ok: true,
      user: {
        id: "u1",
        email: "admin@test.com",
        name: "Admin",
        role: "admin",
      },
    });
  });

  it("lists jobs", async () => {
    const route = await import("@/app/api/jobs/route");
    const request = new Request(
      "http://localhost:3000/api/jobs?page=1&pageSize=10",
    );

    const response = await route.GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.items.length).toBeGreaterThan(0);
  });

  it("creates job", async () => {
    const route = await import("@/app/api/jobs/route");

    const request = new Request("http://localhost:3000/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        title: "Frontend Engineer",
        slug: "frontend-engineer",
        description:
          "A role focused on UI engineering and product collaboration.",
        responsibilities: ["Build UI"],
        requirements: ["3+ years"],
        skills: ["React"],
        department: "Engineering",
        location: "Remote",
        workMode: "remote",
        experience: "3+ years",
        employmentType: "full_time",
        salaryRange: { min: 50000, max: 90000, currency: "USD" },
        openings: 2,
        status: "draft",
      }),
    });

    const response = await route.POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.title).toBe("Frontend Engineer");
  });
});
