/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { apiFetch } from "@/lib/api/client-fetch";
import { formatLpaRange } from "@/lib/jobs/salary";
import { withSearchParams } from "@/lib/utils";
import type { ApiListResult, Job } from "@/lib/types/models";

export function JobsClient() {
  const [jobs, setJobs] = useState<ApiListResult<Job>>({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [experience, setExperience] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const queryUrl = useMemo(
    () =>
      withSearchParams("/api/jobs", {
        search,
        status,
        department,
        location,
        workMode,
        experience,
        page,
        pageSize: 10,
        sortBy,
        sortDir,
      }),
    [
      search,
      status,
      department,
      location,
      workMode,
      experience,
      sortBy,
      sortDir,
      page,
    ],
  );

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<ApiListResult<Job>>(queryUrl)
      .then((data) => {
        setJobs(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [queryUrl]);

  useEffect(() => {
    load();
  }, [load]);

  async function publishJob(id: string) {
    try {
      await apiFetch(`/api/jobs/${id}/publish`, {
        method: "POST",
        body: JSON.stringify({ action: "publish" }),
      });
      toast.success("Job status updated");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function archiveJob(id: string) {
    try {
      await apiFetch(`/api/jobs/${id}/archive`, { method: "POST" });
      toast.success("Job archived");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Archive failed");
    }
  }

  async function duplicateJob(id: string) {
    try {
      await apiFetch(`/api/jobs/${id}/duplicate`, { method: "POST" });
      toast.success("Job duplicated");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Duplicate failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Manage publishing workflow and role requirements"
        action={
          <Link href="/jobs/new">
            <Button>Create Job</Button>
          </Link>
        }
      />

      <FilterBar>
        <Input
          placeholder="Search title, slug, location"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </Select>
        <Input
          placeholder="Department"
          value={department}
          onChange={(e) => {
            setPage(1);
            setDepartment(e.target.value);
          }}
        />
        <Input
          placeholder="Location"
          value={location}
          onChange={(e) => {
            setPage(1);
            setLocation(e.target.value);
          }}
        />
        <Select
          value={workMode}
          onChange={(e) => {
            setPage(1);
            setWorkMode(e.target.value);
          }}
        >
          <option value="">Any work mode</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">Onsite</option>
        </Select>
        <Input
          placeholder="Experience"
          value={experience}
          onChange={(e) => {
            setPage(1);
            setExperience(e.target.value);
          }}
        />
        <Select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
        >
          <option value="updatedAt">Sort by Updated</option>
          <option value="createdAt">Sort by Created</option>
          <option value="title">Sort by Title</option>
        </Select>
        <Select
          value={sortDir}
          onChange={(e) => {
            setSortDir(e.target.value as "asc" | "desc");
            setPage(1);
          }}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </Select>
      </FilterBar>

      <div className="mt-4">
        {loading ? <LoadingState label="Loading jobs" /> : null}
        {!loading && error ? (
          <ErrorState title="Unable to load jobs" description={error} />
        ) : null}
        {!loading && !error ? (
          <>
            <DataTable
              rows={jobs.items}
              emptyState={
                <EmptyState
                  title="No jobs found"
                  description="Try changing filters or creating a new job."
                />
              }
              columns={[
                {
                  key: "title",
                  title: "Title",
                  render: (item) => <p className="font-medium">{item.title}</p>,
                },
                {
                  key: "department",
                  title: "Department",
                  render: (item) => item.department,
                },
                {
                  key: "location",
                  title: "Location",
                  render: (item) => item.location,
                },
                {
                  key: "salary",
                  title: "CTC",
                  render: (item) =>
                    formatLpaRange(item.salaryRange.min, item.salaryRange.max),
                },
                {
                  key: "status",
                  title: "Status",
                  render: (item) => (
                    <span className="rounded-full bg-[var(--color-bg)] px-2 py-1 text-xs capitalize">
                      {item.status}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  title: "Actions",
                  render: (item) => (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/jobs/${item.id}/edit`}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        Edit
                      </Link>
                      <ConfirmModal
                        triggerLabel={
                          item.status === "active" ? "Unpublish" : "Publish"
                        }
                        title="Confirm publish workflow"
                        description="This will update job visibility for candidates."
                        onConfirm={() => publishJob(item.id)}
                      />
                      <button
                        type="button"
                        className="rounded-md border px-2 py-1 text-xs"
                        onClick={() => duplicateJob(item.id)}
                      >
                        Duplicate
                      </button>
                      <ConfirmModal
                        triggerLabel="Archive"
                        title="Archive job"
                        description="Archived jobs will be hidden from active listings."
                        onConfirm={() => archiveJob(item.id)}
                      />
                    </div>
                  ),
                },
              ]}
            />
            <Pagination
              page={jobs.page}
              total={jobs.total}
              pageSize={jobs.pageSize}
              onChange={setPage}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
