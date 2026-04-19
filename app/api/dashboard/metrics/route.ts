import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/route-guards";
import { ok } from "@/lib/api/response";
import {
  getApplicationsSummary,
  listApplications,
} from "@/lib/storage/applications-store";
import { listJobs } from "@/lib/storage/jobs-store";
import type { DashboardMetrics } from "@/lib/types/models";

export async function GET() {
  const auth = await requireApiSession(["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const jobs = await listJobs({
      page: 1,
      pageSize: 10000,
      sortBy: "updatedAt",
      sortDir: "desc",
    });
    const applications = await listApplications({
      page: 1,
      pageSize: 10000,
      sort: "latest",
    });

    const activeJobs = jobs.items.filter(
      (job) => job.status === "active",
    ).length;
    const draftJobs = jobs.items.filter((job) => job.status === "draft").length;
    const appSummary = getApplicationsSummary(applications.items);

    const metrics: DashboardMetrics = {
      totalJobs: jobs.total,
      activeJobs,
      draftJobs,
      totalApplications: appSummary.totalApplications,
      newApplicationsToday: appSummary.newApplicationsToday,
      applicationsByStatus: appSummary.applicationsByStatus,
      recentActivity: jobs.items.slice(0, 5).map((job) => ({
        id: job.id,
        message: `${job.title} is ${job.status}`,
        actor: job.updatedBy || "admin",
        createdAt: job.updatedAt,
      })),
    };

    return ok(metrics);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load dashboard";
    return NextResponse.json(
      { ok: false, error: { message } },
      { status: 500 },
    );
  }
}
