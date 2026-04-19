export type UserRole = "admin";

export type JobStatus = "draft" | "active" | "closed";

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "hired";

export interface AuditTrail {
  updatedBy: string;
  updatedAt: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Job extends AuditTrail {
  id: string;
  title: string;
  slug: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  department: string;
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  experience: string;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  openings: number;
  status: JobStatus;
  archivedAt?: string | null;
  createdAt: string;
}

export interface CandidateApplication extends AuditTrail {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  city?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentRole?: string;
  currentCtc?: string;
  expectedCtc?: string;
  totalExperience?: string;
  noticePeriod?: string;
  role: string;
  resumeUrl?: string;
  resumePath?: string;
  coverLetter?: string;
  skills: string[];
  heardFrom?: string;
  source?: string;
  referral?: string;
  referralName?: string;
  status: ApplicationStatus;
  notes: string[];
  comments: Array<{
    id: string;
    author: string;
    body: string;
    createdAt: string;
  }>;
  assignedRecruiterId?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  totalApplications: number;
  newApplicationsToday: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  recentActivity: Array<{
    id: string;
    message: string;
    actor: string;
    createdAt: string;
  }>;
}

export interface ApiListResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
