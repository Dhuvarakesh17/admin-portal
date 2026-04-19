"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client-fetch";
import { formatLpaRange } from "@/lib/jobs/salary";
import { toStringList } from "@/lib/utils";
import type { Job } from "@/lib/types/models";

const initialForm = {
  title: "",
  slug: "",
  description: "",
  responsibilities: "",
  requirements: "",
  skills: "",
  department: "Engineering",
  location: "Remote",
  workMode: "remote",
  experience: "2+ years",
  employmentType: "full_time",
  salaryMinLpa: "4",
  salaryMaxLpa: "8",
  openings: "1",
  status: "draft",
};

export function JobEditor({
  mode,
  jobId,
}: {
  mode: "create" | "edit";
  jobId?: string;
}) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (mode !== "edit" || !jobId) return;

    apiFetch<Job>(`/api/jobs/${jobId}`)
      .then((job) => {
        setForm({
          title: job.title,
          slug: job.slug,
          description: job.description,
          responsibilities: job.responsibilities.join("\n"),
          requirements: job.requirements.join("\n"),
          skills: job.skills.join("\n"),
          department: job.department,
          location: job.location,
          workMode: job.workMode,
          experience: job.experience,
          employmentType: job.employmentType,
          salaryMinLpa: String(job.salaryRange.min),
          salaryMaxLpa: String(job.salaryRange.max),
          openings: String(job.openings),
          status: job.status,
        });
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [mode, jobId]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      responsibilities: toStringList(form.responsibilities),
      requirements: toStringList(form.requirements),
      skills: toStringList(form.skills),
      department: form.department,
      location: form.location,
      workMode: form.workMode,
      experience: form.experience,
      employmentType: form.employmentType,
      salaryRange: {
        min: Number(form.salaryMinLpa),
        max: Number(form.salaryMaxLpa),
        currency: "INR",
      },
      openings: Number(form.openings),
      status: form.status,
    };

    try {
      if (mode === "create") {
        await apiFetch("/api/jobs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/jobs/${jobId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      toast.success(mode === "create" ? "Job created" : "Job updated");
      router.push("/jobs");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save job",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Card>Loading job data...</Card>;
  }

  return (
    <div>
      <PageHeader
        title={mode === "create" ? "Create Job" : "Edit Job"}
        subtitle="Define role details, pipeline visibility and CTC (LPA)"
      />
      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="grid gap-3">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <TextArea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
            <TextArea
              placeholder="Responsibilities (one per line)"
              value={form.responsibilities}
              onChange={(e) =>
                setForm({ ...form, responsibilities: e.target.value })
              }
              required
            />
            <TextArea
              placeholder="Requirements (one per line)"
              value={form.requirements}
              onChange={(e) =>
                setForm({ ...form, requirements: e.target.value })
              }
              required
            />
            <TextArea
              placeholder="Skills (one per line)"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              required
            />
          </div>
        </Card>

        <Card>
          <div className="grid gap-3">
            <Input
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              required
            />
            <Input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
            <Select
              value={form.workMode}
              onChange={(e) => setForm({ ...form, workMode: e.target.value })}
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </Select>
            <Input
              placeholder="Experience"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              required
            />
            <Select
              value={form.employmentType}
              onChange={(e) =>
                setForm({ ...form, employmentType: e.target.value })
              }
            >
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </Select>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                placeholder="Min CTC (LPA)"
                value={form.salaryMinLpa}
                onChange={(e) =>
                  setForm({ ...form, salaryMinLpa: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Max CTC (LPA)"
                value={form.salaryMaxLpa}
                onChange={(e) =>
                  setForm({ ...form, salaryMaxLpa: e.target.value })
                }
              />
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-muted)]">
                Stored as INR
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Display preview: {formatLpaRange(form.salaryMinLpa, form.salaryMaxLpa)}
            </p>
            <Input
              type="number"
              placeholder="Openings"
              value={form.openings}
              onChange={(e) => setForm({ ...form, openings: e.target.value })}
            />
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </Select>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/jobs")}
              >
                Cancel
              </Button>
              <Button disabled={submitting}>
                {submitting ? "Saving..." : "Save Job"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
