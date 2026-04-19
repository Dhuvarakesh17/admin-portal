import { beforeEach, describe, expect, it } from "vitest";

import { resetJobsStore } from "@/lib/storage/jobs-store";
import { mapJobToPublicJob } from "@/lib/public/jobs-contract";
import type { Job } from "@/lib/types/models";

describe("public jobs api", () => {
  beforeEach(() => {
    resetJobsStore();
    process.env.SUPABASE_SYNC_REQUIRED = "false";
    process.env.ADMIN_ALLOWED_ORIGINS =
      "https://creinx-careers.vercel.app,http://localhost:3000";
  });

  it("returns public jobs without authentication", async () => {
    const route = await import("@/app/api/public/jobs/route");
    const request = new Request("http://localhost:3000/api/public/jobs");

    const response = await route.GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(Array.isArray(payload.data.items)).toBe(true);
    expect(payload.data.total).toBe(payload.data.items.length);
  });

  it("sets CORS headers for allowed origin and omits allow-origin for disallowed origin", async () => {
    const route = await import("@/app/api/public/jobs/route");

    const allowedRequest = new Request(
      "http://localhost:3000/api/public/jobs",
      {
        headers: {
          Origin: "https://creinx-careers.vercel.app",
        },
      },
    );

    const allowedResponse = await route.GET(allowedRequest);
    expect(allowedResponse.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://creinx-careers.vercel.app",
    );
    expect(allowedResponse.headers.get("Vary")).toBe("Origin");
    expect(allowedResponse.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET,OPTIONS",
    );
    expect(allowedResponse.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type",
    );
    expect(allowedResponse.headers.get("Access-Control-Max-Age")).toBe("86400");

    const disallowedRequest = new Request(
      "http://localhost:3000/api/public/jobs",
      {
        headers: {
          Origin: "https://evil.example.com",
        },
      },
    );

    const disallowedResponse = await route.GET(disallowedRequest);
    expect(disallowedResponse.headers.get("Access-Control-Allow-Origin")).toBe(
      null,
    );
    expect(disallowedResponse.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET,OPTIONS",
    );
  });

  it("returns 204 for OPTIONS with expected CORS headers", async () => {
    const route = await import("@/app/api/public/jobs/route");
    const request = new Request("http://localhost:3000/api/public/jobs", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    const response = await route.OPTIONS(request);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET,OPTIONS",
    );
  });

  it("returns only active jobs in public list", async () => {
    const route = await import("@/app/api/public/jobs/route");
    const request = new Request("http://localhost:3000/api/public/jobs");

    const response = await route.GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    const slugs = payload.data.items.map((item: { slug: string }) => item.slug);
    expect(slugs).toContain("frontend-engineer");
    expect(slugs).not.toContain("product-designer");
  });

  it("returns public job detail by slug and 404 for unknown", async () => {
    const route = await import("@/app/api/public/jobs/[slug]/route");

    const foundResponse = await route.GET(
      new Request("http://localhost:3000/api/public/jobs/frontend-engineer"),
      {
        params: Promise.resolve({ slug: "frontend-engineer" }),
      },
    );

    const foundPayload = await foundResponse.json();
    expect(foundResponse.status).toBe(200);
    expect(foundPayload.ok).toBe(true);
    expect(foundPayload.data.slug).toBe("frontend-engineer");

    const unknownResponse = await route.GET(
      new Request("http://localhost:3000/api/public/jobs/unknown"),
      {
        params: Promise.resolve({ slug: "unknown" }),
      },
    );

    const unknownPayload = await unknownResponse.json();
    expect(unknownResponse.status).toBe(404);
    expect(unknownPayload.ok).toBe(false);
  });

  it("normalizes mapper output to public contract keys", () => {
    const input: Job = {
      id: "j1",
      slug: "senior-performance-marketer",
      title: "Senior Performance Marketer",
      description: "Lead growth campaigns",
      responsibilities: ["Run campaigns"],
      requirements: ["5+ years"],
      skills: ["GA4", "Meta Ads"],
      department: "digital-marketing",
      location: "Chennai",
      workMode: "remote",
      experience: "senior",
      employmentType: "contract",
      salaryRange: { min: 0, max: 0, currency: "INR" },
      openings: 1,
      status: "active",
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: "admin",
    };

    const mapped = mapJobToPublicJob(input);
    expect(mapped.department).toBe("Digital Marketing");
    expect(mapped.sector).toBe("digital-marketing");
    expect(mapped.workMode).toBe("Remote");
    expect(mapped.experienceLevel).toBe("Senior");
    expect(mapped.experienceRange).toBe("3-5");
    expect(mapped.type).toBe("Contract");
    expect(mapped.salaryRange).toBe("Salary based on experience");
    expect(mapped.team).toBe("");
    expect(Array.isArray(mapped.niceToHave)).toBe(true);
    expect(Array.isArray(mapped.perks)).toBe(true);
    expect(Array.isArray(mapped.interviewProcess)).toBe(true);

    const keys = [
      "id",
      "slug",
      "title",
      "department",
      "sector",
      "team",
      "location",
      "workMode",
      "experienceLevel",
      "experienceRange",
      "type",
      "salaryRange",
      "summary",
      "skills",
      "postedDaysAgo",
      "statusTags",
      "openings",
      "responsibilities",
      "requiredQualifications",
      "aboutRole",
      "niceToHave",
      "perks",
      "interviewProcess",
    ];

    for (const key of keys) {
      expect(mapped).toHaveProperty(key);
    }
  });
});
