import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { fail } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/route-guards";
import { getApplication } from "@/lib/storage/applications-store";

type StorageReference = {
  bucket: string;
  objectPath: string;
};

function normalizeStoragePath(path: string) {
  return path
    .trim()
    .replace(/^\/+/, "")
    .replace(/^storage\/v1\/object\/(public|sign)\//i, "");
}

function parseFromSupabaseUrl(path: string): StorageReference | null {
  try {
    const url = new URL(path);
    const marker = "/storage/v1/object/";
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;

    const afterMarker = url.pathname.slice(index + marker.length);
    const cleaned = afterMarker.replace(/^(public|sign)\//i, "");
    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    return {
      bucket: parts[0],
      objectPath: parts.slice(1).join("/"),
    };
  } catch {
    return null;
  }
}

function getStorageCandidates(path: string): StorageReference[] {
  const configuredBucket = process.env.SUPABASE_RESUME_BUCKET?.trim();
  const fromUrl = parseFromSupabaseUrl(path);
  const normalized = normalizeStoragePath(path);

  const slashIndex = normalized.indexOf("/");
  const inferredBucket = slashIndex > 0 ? normalized.slice(0, slashIndex) : "";
  const inferredObjectPath =
    slashIndex > 0 ? normalized.slice(slashIndex + 1) : normalized;

  const candidates: StorageReference[] = [];

  if (configuredBucket) {
    candidates.push({
      bucket: configuredBucket,
      objectPath: normalized.startsWith(`${configuredBucket}/`)
        ? normalized.slice(configuredBucket.length + 1)
        : normalized,
    });
  }

  if (fromUrl) {
    candidates.push(fromUrl);
  }

  if (inferredBucket) {
    candidates.push({
      bucket: inferredBucket,
      objectPath: inferredObjectPath,
    });
  }

  candidates.push({
    bucket: "resumes",
    objectPath: normalized,
  });

  const dedup = new Set<string>();
  return candidates.filter((candidate) => {
    if (!candidate.bucket || !candidate.objectPath) {
      return false;
    }
    const key = `${candidate.bucket}::${candidate.objectPath}`;
    if (dedup.has(key)) {
      return false;
    }
    dedup.add(key);
    return true;
  });
}

function getObjectPathVariants(path: string) {
  const normalized = normalizeStoragePath(path);
  const slashIndex = normalized.indexOf("/");

  const variants = [normalized];
  if (slashIndex > 0) {
    variants.push(normalized.slice(slashIndex + 1));
  }

  return Array.from(new Set(variants.filter(Boolean)));
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const application = await getApplication(id);
    if (!application) {
      return fail("Application not found", 404);
    }

    const resumeRef =
      application.resumeUrl?.trim() || application.resumePath?.trim();
    if (!resumeRef) {
      return fail("Resume not available", 404);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return fail(
        "Resume file cannot be resolved because Supabase is not configured.",
        500,
      );
    }

    const references = getStorageCandidates(resumeRef);
    if (!references.length) {
      return fail("Invalid resume path", 400);
    }

    const shouldDownload =
      new URL(request.url).searchParams.get("download") === "1";

    let lastErrorMessage = "Unable to resolve resume URL";
    for (const reference of references) {
      const signed = await supabase.storage
        .from(reference.bucket)
        .createSignedUrl(
          reference.objectPath,
          60,
          shouldDownload ? { download: true } : undefined,
        );

      if (!signed.error && signed.data?.signedUrl) {
        return NextResponse.redirect(signed.data.signedUrl);
      }

      if (signed.error?.message) {
        lastErrorMessage = signed.error.message;
      }
    }

    const listBuckets = await supabase.storage.listBuckets();
    if (!listBuckets.error && listBuckets.data?.length) {
      const objectPathVariants = getObjectPathVariants(resumeRef);
      for (const bucket of listBuckets.data) {
        for (const objectPath of objectPathVariants) {
          const signed = await supabase.storage
            .from(bucket.name)
            .createSignedUrl(
              objectPath,
              60,
              shouldDownload ? { download: true } : undefined,
            );

          if (!signed.error && signed.data?.signedUrl) {
            return NextResponse.redirect(signed.data.signedUrl);
          }

          if (signed.error?.message) {
            lastErrorMessage = signed.error.message;
          }
        }
      }
    }

    throw new Error(lastErrorMessage);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resolve resume file";
    return NextResponse.json(
      { ok: false, error: { message } },
      { status: 500 },
    );
  }
}
