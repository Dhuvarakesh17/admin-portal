import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { mapErrorToResponse } from "@/lib/api/errors";
import { requireApiSession } from "@/lib/api/route-guards";
import { createJob, listJobs } from "@/lib/storage/jobs-store";
import { jobQuerySchema, jobSchema } from "@/lib/validation/job";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const parsed = jobQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    );
    if (!parsed.success) {
      return fail("Invalid query parameters", 400, parsed.error.flatten());
    }

    return ok(await listJobs(parsed.data));
  } catch (error) {
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(
      { ok: false, error: { message: mapped.message } },
      { status: mapped.status },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = jobSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid job payload", 400, parsed.error.flatten());
    }

    return ok(await createJob(parsed.data, auth.user.email), { status: 201 });
  } catch (error) {
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(
      { ok: false, error: { message: mapped.message } },
      { status: mapped.status },
    );
  }
}
