import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import type {
  ApiListResult,
  ApplicationStatus,
  CandidateApplication,
} from "@/lib/types/models";

export type ApplicationQuery = {
  page: number;
  pageSize: number;
  search?: string;
  candidateName?: string;
  candidateEmail?: string;
  role?: string;
  status?: ApplicationStatus;
  sort?: "latest" | "oldest";
};

type ApplicationComment = CandidateApplication["comments"][number];

const seedApplications: CandidateApplication[] = [
  {
    id: "app-1",
    candidateName: "Alex Morgan",
    candidateEmail: "alex@example.com",
    role: "Frontend Engineer",
    resumeUrl: "",
    coverLetter: "Excited to contribute to the product.",
    skills: ["React", "TypeScript"],
    source: "Career Portal",
    referral: "",
    status: "new",
    notes: ["Initial application received"],
    comments: [],
    assignedRecruiterId: "admin",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: "admin",
  },
];

let applications = seedApplications;

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

function isSupabaseSyncRequired() {
  return process.env.SUPABASE_SYNC_REQUIRED === "true";
}

function getApplicationsTable() {
  return process.env.SUPABASE_APPLICATIONS_TABLE ?? "applications";
}

function getStatusColumn() {
  return process.env.SUPABASE_APPLICATIONS_STATUS_COLUMN ?? "status";
}

function getAssigneeColumn() {
  return (
    process.env.SUPABASE_APPLICATIONS_ASSIGNEE_COLUMN ?? "assigned_recruiter_id"
  );
}

function getNotesColumn() {
  return process.env.SUPABASE_APPLICATIONS_NOTES_COLUMN ?? "notes";
}

function getCommentsColumn() {
  return process.env.SUPABASE_APPLICATIONS_COMMENTS_COLUMN ?? "comments";
}

function getUpdatedByColumn() {
  return process.env.SUPABASE_APPLICATIONS_UPDATED_BY_COLUMN ?? "updated_by";
}

function getUpdatedAtColumn() {
  return process.env.SUPABASE_APPLICATIONS_UPDATED_AT_COLUMN ?? "updated_at";
}

function getMissingColumnFromErrorMessage(message: string) {
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1];
}

async function updateApplicationsWithFallback<T>(
  table: string,
  buildQuery: (payload: Record<string, unknown>) => Promise<{
    data: T | null;
    error: { code?: string; message: string } | null;
  }>,
  initialPayload: Record<string, unknown>,
) {
  const payload = { ...initialPayload };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await buildQuery(payload);

    if (!result.error) {
      return result.data;
    }

    const missingColumn = getMissingColumnFromErrorMessage(
      result.error.message,
    );
    if (missingColumn && missingColumn in payload) {
      delete payload[missingColumn];
      continue;
    }

    if (result.error.code === "PGRST116") {
      return null;
    }

    throw new Error(result.error.message);
  }

  throw new Error(
    `Unable to update ${table} with the configured Supabase schema`,
  );
}

function pickValue<T>(
  row: Record<string, unknown>,
  keys: string[],
  fallback: T,
): T {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
}

function asComments(value: unknown): ApplicationComment[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      id: String(item.id ?? randomUUID()),
      author: String(item.author ?? "admin"),
      body: String(item.body ?? ""),
      createdAt: String(
        item.createdAt ?? item.created_at ?? new Date().toISOString(),
      ),
    }))
    .filter((item) => item.body.length > 0);
}

function mapRowToApplication(
  row: Record<string, unknown>,
): CandidateApplication {
  const createdAt = String(
    pickValue(
      row,
      ["created_at", "createdAt", "submitted_at", "applied_at"],
      new Date().toISOString(),
    ),
  );

  return {
    id: String(pickValue(row, ["id"], "")),
    candidateName: String(
      pickValue(
        row,
        ["candidate_name", "candidateName", "name", "full_name"],
        "",
      ),
    ),
    candidateEmail: String(
      pickValue(
        row,
        ["candidate_email", "candidateEmail", "email", "applicant_email"],
        "",
      ),
    ),
    candidatePhone:
      String(pickValue(row, ["candidate_phone", "phone"], "")) || undefined,
    city: String(pickValue(row, ["city"], "")) || undefined,
    linkedinUrl:
      String(pickValue(row, ["linkedin_url", "linkedin", "linkedinUrl"], "")) ||
      undefined,
    portfolioUrl:
      String(
        pickValue(row, ["portfolio_url", "portfolio", "portfolioUrl"], ""),
      ) || undefined,
    currentRole:
      String(pickValue(row, ["current_role", "currentRole"], "")) || undefined,
    currentCtc:
      String(pickValue(row, ["current_ctc", "currentCtc"], "")) || undefined,
    expectedCtc:
      String(pickValue(row, ["expected_ctc", "expectedCtc"], "")) || undefined,
    totalExperience:
      String(
        pickValue(
          row,
          ["experience_years", "total_experience", "experience"],
          "",
        ),
      ) || undefined,
    noticePeriod:
      String(pickValue(row, ["notice_period", "noticePeriod"], "")) ||
      undefined,
    role: String(
      pickValue(row, ["role", "job_role", "position", "job_title"], ""),
    ),
    resumeUrl:
      String(pickValue(row, ["resume_url", "resumeUrl"], "")) || undefined,
    resumePath:
      String(pickValue(row, ["resume_path", "resumePath"], "")) || undefined,
    coverLetter:
      String(pickValue(row, ["cover_letter", "coverLetter"], "")) || undefined,
    skills: asStringArray(pickValue(row, ["skills"], [])),
    heardFrom:
      String(pickValue(row, ["heard_from", "heardFrom"], "")) || undefined,
    source: String(pickValue(row, ["source"], "")) || undefined,
    referral: String(pickValue(row, ["referral"], "")) || undefined,
    referralName:
      String(pickValue(row, ["referral_name", "referralName"], "")) ||
      undefined,
    status: pickValue(
      row,
      [getStatusColumn(), "status"],
      "new",
    ) as ApplicationStatus,
    notes: asStringArray(pickValue(row, [getNotesColumn(), "notes"], [])),
    comments: asComments(pickValue(row, [getCommentsColumn(), "comments"], [])),
    assignedRecruiterId:
      String(
        pickValue(
          row,
          [
            getAssigneeColumn(),
            "assigned_recruiter_id",
            "assignee_id",
            "assigned_to",
          ],
          "",
        ),
      ) || undefined,
    createdAt,
    updatedAt: String(
      pickValue(
        row,
        [
          getUpdatedAtColumn(),
          "updated_at",
          "updatedAt",
          "modified_at",
          "last_updated_at",
        ],
        createdAt,
      ),
    ),
    updatedBy: String(
      pickValue(
        row,
        [getUpdatedByColumn(), "updated_by", "updatedBy", "modified_by"],
        "admin",
      ),
    ),
  };
}

function applyFilters(
  list: CandidateApplication[],
  query: ApplicationQuery,
): CandidateApplication[] {
  const search = query.search?.trim().toLowerCase();

  return list.filter((item) => {
    if (query.status && item.status !== query.status) return false;

    if (
      query.role &&
      item.role.toLowerCase() !== query.role.trim().toLowerCase()
    ) {
      return false;
    }

    if (
      query.candidateName &&
      !item.candidateName
        .toLowerCase()
        .includes(query.candidateName.trim().toLowerCase())
    ) {
      return false;
    }

    if (
      query.candidateEmail &&
      !item.candidateEmail
        .toLowerCase()
        .includes(query.candidateEmail.trim().toLowerCase())
    ) {
      return false;
    }

    if (search) {
      const haystack = [item.candidateName, item.candidateEmail, item.role]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

function paginate(
  list: CandidateApplication[],
  page: number,
  pageSize: number,
): ApiListResult<CandidateApplication> {
  const start = (page - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    page,
    pageSize,
    total: list.length,
  };
}

export async function listApplications(
  query: ApplicationQuery,
): Promise<ApiListResult<CandidateApplication>> {
  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }

  if (supabase) {
    const { data, error } = await supabase
      .from(getApplicationsTable())
      .select("*");
    if (error) {
      throw new Error(error.message);
    }

    const mapped = (data ?? []).map((row) =>
      mapRowToApplication(row as Record<string, unknown>),
    );

    const filtered = applyFilters(mapped, query).sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return query.sort === "oldest" ? diff : -diff;
    });

    return paginate(filtered, query.page, query.pageSize);
  }

  const filtered = applyFilters(applications, query).sort((a, b) => {
    const diff =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return query.sort === "oldest" ? diff : -diff;
  });

  return paginate(filtered, query.page, query.pageSize);
}

export async function getApplication(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }

  if (supabase) {
    const { data, error } = await supabase
      .from(getApplicationsTable())
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return mapRowToApplication(data as Record<string, unknown>);
  }

  return applications.find((item) => item.id === id) ?? null;
}

export async function updateApplicationStatus(
  id: string,
  input: {
    status: ApplicationStatus;
    note?: string;
    assigneeId?: string;
    emailAction?: "shortlist" | "rejection" | "interview";
  },
  actor = "admin",
) {
  const existing = await getApplication(id);
  if (!existing) return null;

  const updatedAt = new Date().toISOString();
  const notes = input.note ? [...existing.notes, input.note] : existing.notes;
  const comments = input.note
    ? [
        ...existing.comments,
        {
          id: randomUUID(),
          author: actor,
          body: input.note,
          createdAt: updatedAt,
        },
      ]
    : existing.comments;

  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }

  if (supabase) {
    const payload: Record<string, unknown> = {
      [getStatusColumn()]: input.status,
      [getUpdatedByColumn()]: actor,
    };

    const updatedAtColumn = getUpdatedAtColumn();
    if (updatedAtColumn) {
      payload[updatedAtColumn] = updatedAt;
    }

    if (input.assigneeId !== undefined) {
      payload[getAssigneeColumn()] = input.assigneeId;
    }

    if (input.note) {
      payload[getNotesColumn()] = notes;
      payload[getCommentsColumn()] = comments;
    }

    const data = await updateApplicationsWithFallback(
      getApplicationsTable(),
      async (currentPayload) => {
        const { data, error } = await supabase
          .from(getApplicationsTable())
          .update(currentPayload)
          .eq("id", id)
          .select("*")
          .single();

        return { data: data as Record<string, unknown> | null, error };
      },
      payload,
    );

    return data ? mapRowToApplication(data as Record<string, unknown>) : null;
  }

  const updated: CandidateApplication = {
    ...existing,
    status: input.status,
    notes,
    comments,
    assignedRecruiterId: input.assigneeId ?? existing.assignedRecruiterId,
    updatedBy: actor,
    updatedAt,
  };

  applications = applications.map((item) => (item.id === id ? updated : item));
  return updated;
}

export async function bulkUpdateApplicationStatus(
  ids: string[],
  status: ApplicationStatus,
  actor = "admin",
) {
  const supabase = getSupabaseClient();
  if (!supabase && isSupabaseSyncRequired()) {
    throw new Error(
      "Supabase sync is required but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing.",
    );
  }

  if (supabase) {
    const updatedAt = new Date().toISOString();
    const payload: Record<string, unknown> = {
      [getStatusColumn()]: status,
      [getUpdatedByColumn()]: actor,
    };

    const updatedAtColumn = getUpdatedAtColumn();
    if (updatedAtColumn) {
      payload[updatedAtColumn] = updatedAt;
    }

    const data = await updateApplicationsWithFallback(
      getApplicationsTable(),
      async (currentPayload) => {
        const { data, error } = await supabase
          .from(getApplicationsTable())
          .update(currentPayload)
          .in("id", ids)
          .select("*");

        return { data: data as Record<string, unknown>[] | null, error };
      },
      payload,
    );

    return {
      updated: (data ?? []).length,
      items: (data ?? []).map((row) =>
        mapRowToApplication(row as Record<string, unknown>),
      ),
    };
  }

  let updatedCount = 0;
  applications = applications.map((item) => {
    if (!ids.includes(item.id)) return item;
    updatedCount += 1;
    return {
      ...item,
      status,
      updatedBy: actor,
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    updated: updatedCount,
    items: applications.filter((a) => ids.includes(a.id)),
  };
}

export function getApplicationsSummary(items: CandidateApplication[]) {
  const byStatus: Record<ApplicationStatus, number> = {
    new: 0,
    reviewing: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
  };

  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
  }

  const today = new Date();
  const dayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const newToday = items.filter(
    (item) => new Date(item.createdAt).getTime() >= dayStart,
  ).length;

  return {
    totalApplications: items.length,
    newApplicationsToday: newToday,
    applicationsByStatus: byStatus,
  };
}

export function resetApplicationsStore() {
  applications = seedApplications.map((item) => ({
    ...item,
    notes: [...item.notes],
    comments: [...item.comments],
    skills: [...item.skills],
  }));
}
