import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/route-guards";
import { getJob, updateJob } from "@/lib/storage/jobs-store";
import { jobSchema } from "@/lib/validation/job";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const job = await getJob(id);
    if (!job) {
      return fail("Job not found", 404);
    }
    return ok(job);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: "Unable to load job" } },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = jobSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid job payload", 400, parsed.error.flatten());
    }

    const job = await updateJob(id, parsed.data, auth.user.email);
    if (!job) {
      return fail("Job not found", 404);
    }

    return ok(job);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: "Unable to update job" } },
      { status: 500 },
    );
  }
}
