"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client-fetch";
import type {
  ApplicationStatus,
  CandidateApplication,
} from "@/lib/types/models";

const statuses: ApplicationStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "hired",
];

export function ApplicationDetailsClient({
  applicationId,
}: {
  applicationId: string;
}) {
  const [application, setApplication] = useState<CandidateApplication | null>(
    null,
  );
  const [status, setStatus] = useState<ApplicationStatus>("new");
  const [note, setNote] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const load = useCallback(() => {
    apiFetch<CandidateApplication>(`/api/applications/${applicationId}`)
      .then((res) => {
        setApplication(res);
        setStatus(res.status);
        setAssigneeId(res.assignedRecruiterId ?? "");
      })
      .catch((err) => toast.error(err.message));
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus() {
    try {
      await apiFetch(`/api/applications/${applicationId}/status`, {
        method: "POST",
        body: JSON.stringify({
          status,
          note,
          assigneeId: assigneeId || undefined,
        }),
      });
      toast.success("Status updated");
      setNote("");
      load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update status",
      );
    }
  }

  async function triggerEmail(type: "shortlist" | "rejection" | "interview") {
    try {
      await apiFetch(`/api/applications/${applicationId}/status`, {
        method: "POST",
        body: JSON.stringify({ status, emailAction: type }),
      });
      toast.success(`${type} email triggered`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Email trigger failed",
      );
    }
  }

  if (!application) {
    return <Card>Loading application...</Card>;
  }

  const resumeHref = application.resumeUrl || application.resumePath;

  return (
    <div>
      <PageHeader
        title={application.candidateName}
        subtitle={`${application.candidateEmail} • ${application.role}`}
      />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="font-display text-lg font-semibold">
            Candidate Profile
          </h2>
          <div className="mt-3 grid gap-2 text-sm">
            <p>
              <strong>Applied Role:</strong> {application.role || "N/A"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="capitalize">{application.status}</span>
            </p>
            <p>
              <strong>Name:</strong> {application.candidateName || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {application.candidateEmail || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {application.candidatePhone || "N/A"}
            </p>
            <p>
              <strong>City:</strong> {application.city || "N/A"}
            </p>
            <p>
              <strong>LinkedIn:</strong> {application.linkedinUrl || "N/A"}
            </p>
            <p>
              <strong>Portfolio:</strong> {application.portfolioUrl || "N/A"}
            </p>
            <p>
              <strong>Current Role:</strong> {application.currentRole || "N/A"}
            </p>
            <p>
              <strong>Current CTC:</strong> {application.currentCtc || "N/A"}
            </p>
            <p>
              <strong>Expected CTC:</strong> {application.expectedCtc || "N/A"}
            </p>
            <p>
              <strong>Experience:</strong>{" "}
              {application.totalExperience || "N/A"}
            </p>
            <p>
              <strong>Notice Period:</strong>{" "}
              {application.noticePeriod || "N/A"}
            </p>
            <p>
              <strong>Source:</strong>{" "}
              {application.heardFrom || application.source || "N/A"}
            </p>
            <p>
              <strong>Referral:</strong>{" "}
              {application.referralName || application.referral || "N/A"}
            </p>
            <p>
              <strong>Applied At:</strong>{" "}
              {new Date(application.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--color-border)] p-3">
            <p className="text-sm font-medium">Resume</p>
            {resumeHref ? (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <a
                  className="underline"
                  href={resumeHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
                <a className="underline" href={resumeHref} download>
                  Download
                </a>
                <span className="text-xs text-[var(--color-muted)] break-all">
                  {application.resumePath || application.resumeUrl}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm">N/A</p>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-[var(--color-border)] p-3">
            <p className="text-sm font-medium">Cover Letter</p>
            <p className="mt-2 text-sm whitespace-pre-wrap">
              {application.coverLetter || "N/A"}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {application.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-[var(--color-bg)] px-3 py-1 text-xs"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-[var(--color-border)] p-3">
            <p className="text-sm font-medium">Internal Notes</p>
            <ul className="mt-2 space-y-1 text-sm">
              {application.notes.length ? (
                application.notes.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))
              ) : (
                <li className="text-[var(--color-muted)]">
                  No internal notes yet.
                </li>
              )}
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">
            Pipeline Actions
          </h2>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            className="mt-3"
          >
            {statuses.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </Select>
          <TextArea
            className="mt-3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Admin note"
          />
          <Input
            className="mt-3"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            placeholder="Assign admin ID (optional)"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={updateStatus}>Update Status</Button>
            <Button
              variant="secondary"
              onClick={() => triggerEmail("shortlist")}
            >
              Shortlist Email
            </Button>
            <Button
              variant="secondary"
              onClick={() => triggerEmail("rejection")}
            >
              Rejection Email
            </Button>
            <Button
              variant="secondary"
              onClick={() => triggerEmail("interview")}
            >
              Interview Invite
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg font-semibold">Admin Comments</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {application.comments.length ? (
              application.comments.map((comment) => (
                <li
                  key={comment.id}
                  className="rounded-lg border border-[var(--color-border)] p-3"
                >
                  <p>{comment.body}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {comment.author} -{" "}
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-[var(--color-muted)]">No comments yet.</li>
            )}
          </ul>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold">
            Activity Timeline
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="rounded-lg border border-[var(--color-border)] p-3">
              Application created on{" "}
              {new Date(application.createdAt).toLocaleString()}
            </li>
            <li className="rounded-lg border border-[var(--color-border)] p-3">
              Last updated by {application.updatedBy} on{" "}
              {new Date(application.updatedAt).toLocaleString()}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
