import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { ApiListResult, Job, JobStatus } from "@/lib/types/models";

export type JobQuery = {
  page: number;
  pageSize: number;
  search?: string;
  status?: JobStatus;
  department?: string;
  location?: string;
  workMode?: "remote" | "hybrid" | "onsite";
  experience?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

const seedJobs: Job[] = [
  {
    id: "job-1",
    title: "Frontend Engineer",
    slug: "frontend-engineer",
    description: "Build and maintain the admin UI for the hiring platform.",
    responsibilities: ["Build UI", "Review pull requests"],
    requirements: ["3+ years experience", "Strong TypeScript"],
    skills: ["React", "TypeScript"],
    department: "Engineering",
    location: "Remote",
    workMode: "remote",
    experience: "3+ years",
    employmentType: "full_time",
    salaryRange: { min: 50000, max: 90000, currency: "USD" },
    openings: 2,
    status: "active",
    archivedAt: null,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    updatedBy: "admin",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "job-2",
    title: "Product Designer",
    slug: "product-designer",
    description: "Design clean workflows for admin and candidate experiences.",
    responsibilities: ["Create wireframes", "Support design reviews"],
    requirements: ["Portfolio", "UI/UX experience"],
    skills: ["Figma", "Design systems"],
    department: "Design",
    location: "Hybrid",
    workMode: "hybrid",
    experience: "2+ years",
    employmentType: "full_time",
    salaryRange: { min: 45000, max: 80000, currency: "USD" },
    openings: 1,
    status: "draft",
    archivedAt: null,
    createdAt: new Date(Date.now() - 172_800_000).toISOString(),
    updatedBy: "admin",
    updatedAt: new Date().toISOString(),
  },
];

let jobs: Job[] = seedJobs;

type SortableJobField = keyof Pick<
  Job,
  "title" | "department" | "location" | "status" | "createdAt" | "updatedAt"
>;

type JobRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  responsibilities: string[] | null;
  requirements: string[] | null;
  skills: string[] | null;
  department: string;
  location: string;
  work_mode: "remote" | "hybrid" | "onsite";
  experience: string;
  employment_type: "full_time" | "part_time" | "contract" | "internship";
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  openings: number;
  status: JobStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

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

function getJobsTable() {
  return process.env.SUPABASE_JOBS_TABLE ?? "jobs";
}

function isSupabaseSyncRequired() {
  return process.env.SUPABASE_SYNC_REQUIRED === "true";
}

function shouldUpsertOnCreate() {
  const value = process.env.SUPABASE_JOBS_UPSERT_ON_CREATE;
  if (!value) return true;
  return value === "true";
}

function getUpsertConflictColumn() {
  return process.env.SUPABASE_JOBS_UPSERT_CONFLICT_COLUMN ?? "slug";
}

function getMissingColumnFromErrorMessage(message: string) {
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1];
}

function shouldFallbackToInsert(message: string) {
  return /no unique or exclusion constraint matching the ON CONFLICT specification/i.test(
    message,
  );
}

function asStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === "string");
}

function normalizeDepartmentForWrite(value: string) {
  const normalized = value.trim().toLowerCase();
  const mapping: Record<string, string> = {
    engineering: "technical",
    tech: "technical",
    product: "technical",
    design: "technical",
    marketing: "digital-marketing",
    "digital marketing": "digital-marketing",
  };

  return mapping[normalized] ?? normalized;
}

function normalizeEmploymentTypeForWrite(value: string) {
  const normalized = value.trim().toLowerCase();
  const mapping: Record<string, string> = {
    full_time: "Full-time",
    "full-time": "Full-time",
    part_time: "Part-time",
    "part-time": "Part-time",
    contract: "Contract",
    internship: "Internship",
  };

  return mapping[normalized] ?? value;
}

function normalizeEmploymentTypeFromRow(value: unknown): Job["employmentType"] {
  const normalized = String(value ?? "").trim().toLowerCase();
  const mapping: Record<string, Job["employmentType"]> = {
    "full-time": "full_time",
    full_time: "full_time",
    "part-time": "part_time",
    part_time: "part_time",
    contract: "contract",
    internship: "internship",
  };

  return mapping[normalized] ?? "full_time";
}

function normalizeExperienceForWrite(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["fresher", "junior", "mid", "senior"].includes(normalized)) {
    return normalized;
  }

  const years = Number.parseInt(normalized, 10);
  if (!Number.isNaN(years)) {
    if (years <= 1) return "fresher";
    if (years <= 3) return "junior";
    if (years <= 5) return "mid";
    return "senior";
  }

  return normalized;
}

function mapRowToJob(row: Partial<JobRow> & Record<string, unknown>): Job {
  const salaryRangeMaybe =
    (row.salary_range as
      | { min?: number; max?: number; currency?: string }
      | undefined) ?? {};

  const salaryMin =
    row.salary_min ??
    (typeof salaryRangeMaybe.min === "number" ? salaryRangeMaybe.min : 0);
  const salaryMax =
    row.salary_max ??
    (typeof salaryRangeMaybe.max === "number" ? salaryRangeMaybe.max : 0);
  const salaryCurrency =
    row.salary_currency ??
    (typeof salaryRangeMaybe.currency === "string"
      ? salaryRangeMaybe.currency
      : "USD");

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    description: String(row.description ?? ""),
    responsibilities: asStringArray(row.responsibilities),
    requirements: asStringArray(row.requirements),
    skills: asStringArray(row.skills),
    department: String(row.department ?? ""),
    location: String(row.location ?? ""),
    workMode: (row.work_mode as Job["workMode"]) ?? "remote",
    experience: String(row.experience ?? ""),
    employmentType: normalizeEmploymentTypeFromRow(row.employment_type),
    salaryRange: {
      min: Number(salaryMin),
      max: Number(salaryMax),
      currency: String(salaryCurrency),
    },
    openings: Number(row.openings ?? 1),
    status: (row.status as JobStatus) ?? "draft",
    archivedAt: (row.archived_at as string | null | undefined) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(
      row.updated_at ?? row.created_at ?? new Date().toISOString(),
    ),
    updatedBy: String(row.updated_by ?? "admin"),
  };
}

function mapJobToRow(
  job: Omit<Job, "id" | "createdAt" | "updatedAt" | "updatedBy">,
  actor: string,
) {
  return {
    title: job.title,
    slug: job.slug,
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    skills: job.skills,
    department: normalizeDepartmentForWrite(job.department),
    location: job.location,
    work_mode: job.workMode,
    experience: normalizeExperienceForWrite(job.experience),
    employment_type: normalizeEmploymentTypeForWrite(job.employmentType),
    salary_min: job.salaryRange.min,
    salary_max: job.salaryRange.max,
    salary_currency: job.salaryRange.currency,
    openings: job.openings,
    status: job.status,
    archived_at: job.archivedAt ?? null,
    updated_by: actor,
  } as Record<string, unknown>;
}

function now() {
  return new Date().toISOString();
}

function cloneJob(job: Job, overrides: Partial<Job> = {}): Job {
  return {
    ...job,
    ...overrides,
    salaryRange: { ...job.salaryRange, ...(overrides.salaryRange ?? {}) },
    responsibilities: overrides.responsibilities ?? [...job.responsibilities],
    requirements: overrides.requirements ?? [...job.requirements],
    skills: overrides.skills ?? [...job.skills],
  };
}

export async function listJobs(query: JobQuery): Promise<ApiListResult<Job>> {
  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }
  if (supabase) {
    const sortColumnMap: Record<string, string> = {
      title: "title",
      department: "department",
      location: "location",
      status: "status",
      createdAt: "created_at",
      updatedAt: "created_at",
    };
    const orderBy = sortColumnMap[query.sortBy ?? ""] ?? "updated_at";
    const ascending = (query.sortDir ?? "desc") === "asc";

    let queryBuilder = supabase
      .from(getJobsTable())
      .select("*", { count: "exact" })
      .order(orderBy, { ascending });

    if (query.search?.trim()) {
      const term = query.search.trim();
      queryBuilder = queryBuilder.or(
        `title.ilike.%${term}%,slug.ilike.%${term}%,location.ilike.%${term}%,department.ilike.%${term}%`,
      );
    }
    if (query.status) queryBuilder = queryBuilder.eq("status", query.status);
    if (query.department)
      queryBuilder = queryBuilder.eq("department", query.department);
    if (query.location)
      queryBuilder = queryBuilder.eq("location", query.location);
    if (query.workMode)
      queryBuilder = queryBuilder.eq("work_mode", query.workMode);
    if (query.experience)
      queryBuilder = queryBuilder.eq("experience", query.experience);

    const start = (query.page - 1) * query.pageSize;
    const end = start + query.pageSize - 1;
    const { data, count, error } = await queryBuilder.range(start, end);

    if (error) {
      throw new Error(error.message);
    }

    return {
      items: (data ?? []).map((row) => mapRowToJob(row)),
      page: query.page,
      pageSize: query.pageSize,
      total: count ?? 0,
    };
  }

  const search = query.search?.trim().toLowerCase();
  const filtered = jobs.filter((job) => {
    if (search) {
      const haystack = [job.title, job.slug, job.location, job.department]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (query.status && job.status !== query.status) return false;
    if (query.department && job.department !== query.department) return false;
    if (query.location && job.location !== query.location) return false;
    if (query.workMode && job.workMode !== query.workMode) return false;
    if (query.experience && job.experience !== query.experience) return false;
    return true;
  });

  const allowedSortFields: SortableJobField[] = [
    "title",
    "department",
    "location",
    "status",
    "createdAt",
    "updatedAt",
  ];
  const sortBy = allowedSortFields.includes(
    (query.sortBy ?? "") as SortableJobField,
  )
    ? ((query.sortBy as SortableJobField) ?? "updatedAt")
    : "updatedAt";
  const sortDir = query.sortDir ?? "desc";

  filtered.sort((left, right) => {
    const leftValue = String(left[sortBy] ?? "");
    const rightValue = String(right[sortBy] ?? "");
    const comparison = leftValue.localeCompare(rightValue);
    return sortDir === "asc" ? comparison : -comparison;
  });

  const page = query.page;
  const pageSize = query.pageSize;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    page,
    pageSize,
    total: filtered.length,
  };
}

export async function getJob(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }
  if (supabase) {
    const { data, error } = await supabase
      .from(getJobsTable())
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return mapRowToJob(data);
  }

  return jobs.find((job) => job.id === id) ?? null;
}

export async function createJob(
  input: Omit<Job, "id" | "createdAt" | "updatedAt" | "updatedBy">,
  actor = "admin",
) {
  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }
  if (supabase) {
    const payload = mapJobToRow(input, actor);
    let useUpsert = shouldUpsertOnCreate();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const builder = useUpsert
        ? supabase
            .from(getJobsTable())
            .upsert(payload, { onConflict: getUpsertConflictColumn() })
        : supabase.from(getJobsTable()).insert(payload);

      const { data, error } = await builder.select("*").single();
      if (!error) {
        return mapRowToJob(data);
      }

      const missingColumn = getMissingColumnFromErrorMessage(error.message);
      if (missingColumn && missingColumn in payload) {
        delete payload[missingColumn];
        continue;
      }

      if (useUpsert && shouldFallbackToInsert(error.message)) {
        useUpsert = false;
        continue;
      }

      throw new Error(error.message);
    }

    throw new Error("Unable to create job with the configured Supabase schema");
  }

  const createdAt = now();
  const job: Job = {
    ...input,
    id: `job-${randomUUID()}`,
    createdAt,
    updatedAt: createdAt,
    updatedBy: actor,
  };
  jobs = [job, ...jobs];
  return job;
}

export async function updateJob(
  id: string,
  input: Omit<Job, "id" | "createdAt" | "updatedAt" | "updatedBy">,
  actor = "admin",
) {
  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }
  if (supabase) {
    const payload = mapJobToRow(input, actor);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { data, error } = await supabase
        .from(getJobsTable())
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (!error) {
        return mapRowToJob(data);
      }

      if (error.code === "PGRST116") return null;

      const missingColumn = getMissingColumnFromErrorMessage(error.message);
      if (missingColumn && missingColumn in payload) {
        delete payload[missingColumn];
        continue;
      }

      throw new Error(error.message);
    }

    throw new Error("Unable to update job with the configured Supabase schema");
  }

  const existing = await getJob(id);
  if (!existing) return null;

  const updated = cloneJob(existing, {
    ...input,
    updatedAt: now(),
    updatedBy: actor,
  });

  jobs = jobs.map((job) => (job.id === id ? updated : job));
  return updated;
}

export async function publishJob(
  id: string,
  action: "publish" | "unpublish",
  actor = "admin",
) {
  const existing = await getJob(id);
  if (!existing) return null;

  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }
  if (supabase) {
    const payload: Record<string, unknown> = {
      status: action === "publish" ? "active" : "draft",
      updated_by: actor,
    };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { data, error } = await supabase
        .from(getJobsTable())
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (!error) {
        return mapRowToJob(data);
      }

      if (error.code === "PGRST116") return null;

      const missingColumn = getMissingColumnFromErrorMessage(error.message);
      if (missingColumn && missingColumn in payload) {
        delete payload[missingColumn];
        continue;
      }

      throw new Error(error.message);
    }

    throw new Error(
      "Unable to publish job with the configured Supabase schema",
    );
  }

  const updated = cloneJob(existing, {
    status: action === "publish" ? "active" : "draft",
    updatedAt: now(),
    updatedBy: actor,
  });

  jobs = jobs.map((job) => (job.id === id ? updated : job));
  return updated;
}

export async function duplicateJob(id: string, actor = "admin") {
  const existing = await getJob(id);
  if (!existing) return null;

  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }
  if (supabase) {
    const duplicatePayload: Omit<
      Job,
      "id" | "createdAt" | "updatedAt" | "updatedBy"
    > = {
      title: `${existing.title} Copy`,
      slug: `${existing.slug}-copy`,
      description: existing.description,
      responsibilities: existing.responsibilities,
      requirements: existing.requirements,
      skills: existing.skills,
      department: existing.department,
      location: existing.location,
      workMode: existing.workMode,
      experience: existing.experience,
      employmentType: existing.employmentType,
      salaryRange: existing.salaryRange,
      openings: existing.openings,
      status: "draft",
      archivedAt: null,
    };

    const payload = mapJobToRow(duplicatePayload, actor);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { data, error } = await supabase
        .from(getJobsTable())
        .insert(payload)
        .select("*")
        .single();

      if (!error) {
        return mapRowToJob(data);
      }

      const missingColumn = getMissingColumnFromErrorMessage(error.message);
      if (missingColumn && missingColumn in payload) {
        delete payload[missingColumn];
        continue;
      }

      throw new Error(error.message);
    }

    throw new Error(
      "Unable to duplicate job with the configured Supabase schema",
    );
  }

  const copied = cloneJob(existing, {
    id: `job-${randomUUID()}`,
    slug: `${existing.slug}-copy`,
    title: `${existing.title} Copy`,
    status: "draft",
    createdAt: now(),
    updatedAt: now(),
    updatedBy: actor,
    archivedAt: null,
  });

  jobs = [copied, ...jobs];
  return copied;
}

export async function removeJob(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }
  if (supabase) {
    const { data, error } = await supabase
      .from(getJobsTable())
      .delete()
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return mapRowToJob(data);
  }

  const existing = jobs.find((job) => job.id === id);
  if (!existing) return null;

  jobs = jobs.filter((job) => job.id !== id);
  return existing;
}

export function resetJobsStore() {
  jobs = seedJobs.map((job) => ({ ...job }));
}
