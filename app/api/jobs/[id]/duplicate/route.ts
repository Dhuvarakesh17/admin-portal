import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/route-guards";
import { duplicateJob } from "@/lib/storage/jobs-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const job = await duplicateJob(id, auth.user.email);
    if (!job) {
      return fail("Job not found", 404);
    }

    return ok(job, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: "Unable to duplicate job" } },
      { status: 500 },
    );
  }
}
