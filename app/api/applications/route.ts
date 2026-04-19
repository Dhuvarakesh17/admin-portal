import { NextResponse } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/route-guards";
import { listApplications } from "@/lib/storage/applications-store";
import { applicationQuerySchema } from "@/lib/validation/application";

export async function GET(request: Request) {
  const auth = await requireApiSession(["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const parsed = applicationQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!parsed.success) {
      return fail("Invalid query parameters", 400, parsed.error.flatten());
    }

    const data = await listApplications(parsed.data);
    return ok(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load applications";
    return NextResponse.json(
      { ok: false, error: { message } },
      { status: 500 },
    );
  }
}
