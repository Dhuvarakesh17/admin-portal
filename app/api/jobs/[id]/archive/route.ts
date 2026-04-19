import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/route-guards";
import { removeJob } from "@/lib/storage/jobs-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const job = await removeJob(id);
    if (!job) {
      return fail("Job not found", 404);
    }

    return ok({ removed: true, job });
  } catch {
    return NextResponse.json(
      { ok: false, error: { message: "Unable to remove job" } },
      { status: 500 },
    );
  }
}
