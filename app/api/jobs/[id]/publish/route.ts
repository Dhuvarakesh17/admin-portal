import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/route-guards";
import { publishJob } from "@/lib/storage/jobs-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    if (!["publish", "unpublish"].includes(action)) {
      return fail("Invalid publish action", 400);
    }

    const job = await publishJob(id, action, auth.user.email);
    if (!job) {
      return fail("Job not found", 404);
    }

    return ok(job);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: "Unable to update job status" } },
      { status: 500 },
    );
  }
}
