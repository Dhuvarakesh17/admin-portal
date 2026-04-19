import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/route-guards";
import { getApplication } from "@/lib/storage/applications-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const data = await getApplication(id);
    if (!data) {
      return fail("Application not found", 404);
    }

    return ok(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load application";
    return NextResponse.json(
      { ok: false, error: { message } },
      { status: 500 },
    );
  }
}
