import { NextResponse } from "next/server";
import { ok, fail } from "@/lib/api/response";
import {
  requireApiSession,
  requireMutationProtection,
} from "@/lib/api/route-guards";
import { updateApplicationStatus } from "@/lib/storage/applications-store";
import { updateApplicationStatusSchema } from "@/lib/validation/application";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession(["admin"]);
  if (!auth.ok) return auth.response;

  const protectionError = await requireMutationProtection();
  if (protectionError) return protectionError;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateApplicationStatusSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid status update payload", 400, parsed.error.flatten());
    }

    const data = await updateApplicationStatus(
      id,
      parsed.data,
      auth.user.email,
    );
    if (!data) {
      return fail("Application not found", 404);
    }

    return ok(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update application";
    return NextResponse.json(
      { ok: false, error: { message } },
      { status: 500 },
    );
  }
}
