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
import { apiFetch } from "@/lib/api/client-fetch";
import { withSearchParams } from "@/lib/utils";
import type {
  ApiListResult,
  ApplicationStatus,
  CandidateApplication,
} from "@/lib/types/models";

const statusOrder: ApplicationStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "hired",
];

export function ApplicationsClient() {
  const [data, setData] = useState<ApiListResult<CandidateApplication>>({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [page, setPage] = useState(1);

  const queryUrl = useMemo(
    () =>
      withSearchParams("/api/applications", {
        search,
        status,
        role,
        page,
        pageSize: 10,
        sort,
      }),
    [search, status, role, sort, page],
  );

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<ApiListResult<CandidateApplication>>(queryUrl)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [queryUrl]);

  useEffect(() => {
    load();
  }, [load]);

  async function bulkUpdate(target: ApplicationStatus) {
    if (!selected.length) return;

    try {
      await apiFetch("/api/applications/bulk-status", {
        method: "POST",
        body: JSON.stringify({ applicationIds: selected, status: target }),
      });
      toast.success(`Moved ${selected.length} application(s) to ${target}`);
      setSelected([]);
      load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bulk update failed",
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Triage incoming candidates quickly with search and status pipeline"
        action={
          <div className="flex gap-2">
            {statusOrder.map((item) => (
              <Button
                key={item}
                variant="secondary"
                onClick={() => bulkUpdate(item)}
              >
                Mark {item}
              </Button>
            ))}
          </div>
        }
      />

      <FilterBar>
        <Input
          placeholder="Search candidate name, email or role"
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
          <option value="">All statuses</option>
          {statusOrder.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Role"
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
        />
        <Select
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value as "latest" | "oldest");
          }}
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </Select>
      </FilterBar>

      <div className="mt-4">
        {loading ? <LoadingState label="Loading applications" /> : null}
        {!loading && error ? (
          <ErrorState title="Unable to load applications" description={error} />
        ) : null}
        {!loading && !error ? (
          <>
            <DataTable
              rows={data.items}
              emptyState={
                <EmptyState
                  title="No applications found"
                  description="Try adjusting filters or check if jobs are active."
                />
              }
              columns={[
                {
                  key: "select",
                  title: "",
                  render: (item) => (
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.candidateName}`}
                      checked={selected.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected((prev) => [...prev, item.id]);
                        } else {
                          setSelected((prev) =>
                            prev.filter((id) => id !== item.id),
                          );
                        }
                      }}
                    />
                  ),
                },
                {
                  key: "name",
                  title: "Candidate",
                  render: (item) => item.candidateName,
                },
                {
                  key: "email",
                  title: "Email",
                  render: (item) => item.candidateEmail,
                },
                { key: "role", title: "Role", render: (item) => item.role },
                {
                  key: "status",
                  title: "Status",
                  render: (item) => (
                    <span className="capitalize">{item.status}</span>
                  ),
                },
                {
                  key: "updated",
                  title: "Updated",
                  render: (item) =>
                    new Date(item.updatedAt).toLocaleDateString(),
                },
                {
                  key: "details",
                  title: "",
                  render: (item) => (
                    <Link
                      className="rounded-md border px-2 py-1 text-xs"
                      href={`/applications/${item.id}`}
                    >
                      Details
                    </Link>
                  ),
                },
              ]}
            />
            <Pagination
              page={data.page}
              total={data.total}
              pageSize={data.pageSize}
              onChange={setPage}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
