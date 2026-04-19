import { NextResponse } from "next/server";

import { applyPublicReadCors } from "@/lib/public/cors";
import {
  isPubliclyVisibleJob,
  mapJobToPublicJob,
} from "@/lib/public/jobs-contract";
import { getJobBySlug } from "@/lib/storage/jobs-store";

export async function OPTIONS(request: Request) {
  return applyPublicReadCors(request, new NextResponse(null, { status: 204 }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const job = await getJobBySlug(slug);

    if (!job || !isPubliclyVisibleJob(job)) {
      return applyPublicReadCors(
        request,
        NextResponse.json(
          {
            ok: false,
            error: { message: "Job not found" },
          },
          { status: 404 },
        ),
      );
    }

    return applyPublicReadCors(
      request,
      NextResponse.json({
        ok: true,
        data: mapJobToPublicJob(job),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load public job";

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
