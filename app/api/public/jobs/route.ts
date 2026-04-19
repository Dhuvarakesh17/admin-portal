import { NextResponse } from "next/server";

import { applyPublicReadCors } from "@/lib/public/cors";
import {
  isPubliclyVisibleJob,
  mapJobToPublicJob,
} from "@/lib/public/jobs-contract";
import { listJobs } from "@/lib/storage/jobs-store";

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

export async function OPTIONS(request: Request) {
  return applyPublicReadCors(request, new NextResponse(null, { status: 204 }));
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

    const items = result.items
      .filter(isPubliclyVisibleJob)
      .map((job) => mapJobToPublicJob(job));

    return applyPublicReadCors(
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

    return applyPublicReadCors(
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
