import { z } from "zod";

export const applicationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  candidateName: z.string().optional(),
  candidateEmail: z.string().optional(),
  role: z.string().optional(),
  status: z
    .enum(["new", "reviewing", "shortlisted", "rejected", "hired"])
    .optional(),
  sort: z.enum(["latest", "oldest"]).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["new", "reviewing", "shortlisted", "rejected", "hired"]),
  note: z.string().max(1000).optional(),
  assigneeId: z.string().optional(),
  emailAction: z.enum(["shortlist", "rejection", "interview"]).optional(),
});

export const bulkStatusUpdateSchema = z.object({
  applicationIds: z.array(z.string()).min(1),
  status: z.enum(["new", "reviewing", "shortlisted", "rejected", "hired"]),
});
