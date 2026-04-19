import { NextResponse } from "next/server";
import { ok, fail } from "@/lib/api/response";
import {
  requireApiSession,
  requireMutationProtection,
} from "@/lib/api/route-guards";
import { bulkUpdateApplicationStatus } from "@/lib/storage/applications-store";
import { bulkStatusUpdateSchema } from "@/lib/validation/application";

export async function POST(request: Request) {
  const auth = await requireApiSession(["admin"]);
  if (!auth.ok) return auth.response;

  const protectionError = await requireMutationProtection(request);
  if (protectionError) return protectionError;

  try {
    const body = await request.json();
    const parsed = bulkStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid bulk status payload", 400, parsed.error.flatten());
    }

    const data = await bulkUpdateApplicationStatus(
      parsed.data.applicationIds,
      parsed.data.status,
      auth.user.email,
    );

    return ok(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update applications";
    return NextResponse.json(
      { ok: false, error: { message } },
      { status: 500 },
    );
  }
}
