import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(20),
  responsibilities: z.array(z.string()).min(1),
  requirements: z.array(z.string()).min(1),
  skills: z.array(z.string()).min(1),
  department: z.string().min(2),
  location: z.string().min(2),
  workMode: z.enum(["remote", "hybrid", "onsite"]),
  experience: z.string().min(2),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
  salaryRange: z.object({
    min: z.number().nonnegative().max(200),
    max: z.number().nonnegative().max(200),
    currency: z.string().length(3).optional().default("INR"),
  }),
  openings: z.number().int().positive(),
  status: z.enum(["draft", "active", "closed"]),
});

export const jobQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).optional(),
  experience: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});
