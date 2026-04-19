import { NextResponse } from "next/server";

import { listJobs } from "@/lib/storage/jobs-store";

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

function getAllowedOrigins() {
  const raw = process.env.ADMIN_ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function applyCors(request: Request, response: NextResponse) {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

function toDepartmentLabel(value: string) {
  return value === "digital-marketing" ? "Digital Marketing" : "Technical";
}

function toSector(value: string) {
  return value === "digital-marketing" ? "digital-marketing" : "technical";
}

function toWorkModeLabel(value: "remote" | "hybrid" | "onsite") {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "Onsite";
}

function toEmploymentTypeLabel(value: string) {
  if (value === "full_time") return "Full-time";
  if (value === "part_time") return "Part-time";
  if (value === "contract") return "Contract";
  if (value === "internship") return "Internship";
  return "Full-time";
}

function toExperienceLevel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("fresher")) return "Fresher";
  if (normalized.includes("junior")) return "Junior";
  if (normalized.includes("senior")) return "Senior";
  return "Mid";
}

function toSalaryRange(min: number, max: number, currency: string) {
  if (!min && !max) {
    return "Not disclosed";
  }

  const symbol = currency.toUpperCase() === "INR" ? "INR" : currency;
  return `${symbol} ${min.toLocaleString()} - ${max.toLocaleString()}`;
}

function toPostedDaysAgo(createdAt: string) {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  const diff = Date.now() - created;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export async function OPTIONS(request: Request) {
  return applyCors(request, new NextResponse(null, { status: 204 }));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageSizeRaw = Number.parseInt(
      url.searchParams.get("limit") ?? `${DEFAULT_PAGE_SIZE}`,
      10,
    );
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number.isNaN(pageSizeRaw) ? DEFAULT_PAGE_SIZE : pageSizeRaw),
    );

    const search = (url.searchParams.get("q") ?? "").trim();
    const workModeRaw = (url.searchParams.get("workMode") ?? "").trim();
    const departmentRaw = (url.searchParams.get("department") ?? "").trim();

    const workMode =
      workModeRaw === "remote" ||
      workModeRaw === "hybrid" ||
      workModeRaw === "onsite"
        ? workModeRaw
        : undefined;

    const department = departmentRaw || undefined;

    const result = await listJobs({
      page: 1,
      pageSize,
      sortBy: "updatedAt",
      sortDir: "desc",
      status: "active",
      search: search || undefined,
      workMode,
      department,
    });

    const items = result.items.map((job) => {
      const departmentLabel = toDepartmentLabel(job.department);

      return {
        id: job.id,
        slug: job.slug,
        title: job.title,
        department: departmentLabel,
        sector: toSector(job.department),
        team: "",
        location: job.location,
        workMode: toWorkModeLabel(job.workMode),
        experienceLevel: toExperienceLevel(job.experience),
        experienceRange: job.experience,
        type: toEmploymentTypeLabel(job.employmentType),
        salaryRange: toSalaryRange(
          job.salaryRange.min,
          job.salaryRange.max,
          job.salaryRange.currency,
        ),
        summary: job.description,
        skills: job.skills,
        postedDaysAgo: toPostedDaysAgo(job.createdAt),
        statusTags: [job.status === "active" ? "Live" : job.status],
        openings: job.openings,
        responsibilities: job.responsibilities,
        requiredQualifications: job.requirements,
        niceToHave: [],
        perks: [],
        aboutRole: [job.description],
        interviewProcess: [],
      };
    });

    return applyCors(
      request,
      NextResponse.json({
        ok: true,
        data: {
          items,
          total: items.length,
        },
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load public jobs";

    return applyCors(
      request,
      NextResponse.json(
        {
          ok: false,
          error: { message },
        },
        { status: 500 },
      ),
    );
  }
}