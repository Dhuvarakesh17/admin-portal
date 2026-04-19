import { NextResponse } from "next/server";
import { adminRequest } from "@/lib/api/admin-client";
import { mapErrorToResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/route-guards";

const fallbackPayload = {
  teamsEnabled: true,
  emailTemplates: [
    { key: "shortlist", name: "Shortlist Message" },
    { key: "rejection", name: "Rejection Message" },
    { key: "interview", name: "Interview Invite" },
  ],
  departments: ["Engineering", "Product", "Design"],
  tags: ["urgent", "campus", "executive"],
  apiHealth: "ok" as const,
};

export async function GET() {
  const auth = await requireApiSession(["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const path = process.env.JB_PORTAL_ADMIN_SETTINGS_PATH;
    if (!path) {
      return ok(fallbackPayload);
    }

    const data = await adminRequest(path, {
      headers: { "x-admin-user-id": auth.user.id },
    });
    return ok(data);
  } catch (error) {
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(
      { ok: false, error: { message: mapped.message } },
      { status: mapped.status },
    );
  }
}

