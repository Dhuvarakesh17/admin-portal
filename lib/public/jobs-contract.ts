import type { Job } from "@/lib/types/models";

export type PublicJob = {
  id: string;
  slug: string;
  title: string;
  department: "Technical" | "Digital Marketing";
  sector: "technical" | "digital-marketing";
  team: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "Onsite";
  experienceLevel: "Fresher" | "Junior" | "Mid" | "Senior";
  experienceRange: "0-1" | "1-3" | "3-5" | "5+";
  type: "Full-time" | "Part-time" | "Internship" | "Contract";
  salaryRange: string;
  summary: string;
  skills: string[];
  postedDaysAgo: number;
  statusTags: string[];
  openings: number;
  responsibilities: string[];
  requiredQualifications: string[];
  aboutRole: string[];
  niceToHave: string[];
  perks: string[];
  interviewProcess: string[];
};

function isMarketingDepartment(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "digital-marketing" ||
    normalized === "digital marketing" ||
    normalized.includes("marketing")
  );
}

function toDepartment(value: string): PublicJob["department"] {
  return isMarketingDepartment(value) ? "Digital Marketing" : "Technical";
}

function toSector(value: string): PublicJob["sector"] {
  return isMarketingDepartment(value) ? "digital-marketing" : "technical";
}

function toWorkMode(value: Job["workMode"]): PublicJob["workMode"] {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "Onsite";
}

function inferExperienceLevel(value: string): PublicJob["experienceLevel"] {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("fresher")) return "Fresher";
  if (normalized.includes("junior")) return "Junior";
  if (normalized.includes("senior")) return "Senior";
  if (normalized.includes("mid")) return "Mid";

  const years = Number.parseInt(normalized, 10);
  if (Number.isNaN(years)) return "Mid";
  if (years <= 1) return "Fresher";
  if (years <= 3) return "Junior";
  if (years <= 5) return "Mid";
  return "Senior";
}

function toExperienceRange(
  level: PublicJob["experienceLevel"],
): PublicJob["experienceRange"] {
  if (level === "Fresher") return "0-1";
  if (level === "Junior" || level === "Mid") return "1-3";
  if (level === "Senior") return "3-5";
  return "5+";
}

function toEmploymentType(value: Job["employmentType"]): PublicJob["type"] {
  if (value === "full_time") return "Full-time";
  if (value === "part_time") return "Part-time";
  if (value === "internship") return "Internship";
  if (value === "contract") return "Contract";
  return "Full-time";
}

function formatCurrencyValue(value: number, currency: string) {
  if (currency.toUpperCase() === "INR") {
    return `INR ${value.toLocaleString("en-IN")}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function toSalaryRange(job: Job) {
  const min = Number(job.salaryRange.min);
  const max = Number(job.salaryRange.max);
  const currency = String(job.salaryRange.currency || "USD");

  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;

  if (!hasMin && !hasMax) {
    return "Salary based on experience";
  }

  if (hasMin && hasMax) {
    return `${formatCurrencyValue(min, currency)} - ${formatCurrencyValue(max, currency)}`;
  }

  if (hasMin) {
    return `From ${formatCurrencyValue(min, currency)}`;
  }

  return `Up to ${formatCurrencyValue(max, currency)}`;
}

function toPostedDaysAgo(job: Job) {
  const source = job.updatedAt || job.createdAt;
  const timestamp = new Date(source).getTime();

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  const diff = Date.now() - timestamp;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function isPubliclyVisibleJob(job: Job) {
  return job.status === "active";
}

export function mapJobToPublicJob(job: Job): PublicJob {
  const experienceLevel = inferExperienceLevel(job.experience);

  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    department: toDepartment(job.department),
    sector: toSector(job.department),
    team: "",
    location: job.location,
    workMode: toWorkMode(job.workMode),
    experienceLevel,
    experienceRange: toExperienceRange(experienceLevel),
    type: toEmploymentType(job.employmentType),
    salaryRange: toSalaryRange(job),
    summary: job.description,
    skills: job.skills ?? [],
    postedDaysAgo: toPostedDaysAgo(job),
    statusTags: ["Active"],
    openings: Math.max(1, Number(job.openings || 1)),
    responsibilities: job.responsibilities ?? [],
    requiredQualifications: job.requirements ?? [],
    aboutRole: job.description ? [job.description] : [],
    niceToHave: [],
    perks: [],
    interviewProcess: [],
  };
}
