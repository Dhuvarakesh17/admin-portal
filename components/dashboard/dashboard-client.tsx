"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { apiFetch } from "@/lib/api/client-fetch";
import type { DashboardMetrics } from "@/lib/types/models";

const defaultMetrics: DashboardMetrics = {
  totalJobs: 0,
  activeJobs: 0,
  draftJobs: 0,
  totalApplications: 0,
  newApplicationsToday: 0,
  applicationsByStatus: {
    new: 0,
    reviewing: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
  },
  recentActivity: [],
};

export function DashboardClient() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardMetrics>("/api/dashboard/metrics")
      .then((data) => {
        setMetrics(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading dashboard" />;
  if (error)
    return <ErrorState title="Unable to load dashboard" description={error} />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Monitor jobs, applications, and admin activity in one place"
        action={
          <div className="flex gap-2">
            <Link href="/jobs/new">
              <Button>Create job</Button>
            </Link>
            <Link href="/applications">
              <Button variant="secondary">Review applications</Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total Jobs" value={metrics.totalJobs} />
        <KpiCard label="Active Jobs" value={metrics.activeJobs} />
        <KpiCard label="Draft Jobs" value={metrics.draftJobs} />
        <KpiCard label="Total Applications" value={metrics.totalApplications} />
        <KpiCard label="New Today" value={metrics.newApplicationsToday} />
        <KpiCard
          label="Shortlisted"
          value={metrics.applicationsByStatus.shortlisted}
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="font-display text-lg font-semibold">
            Applications by status
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {Object.entries(metrics.applicationsByStatus).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-lg bg-[var(--color-bg)] px-3 py-2"
                >
                  <span className="capitalize">{status}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ),
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">
            Recent activity
          </h2>
          <ul className="mt-3 space-y-3">
            {metrics.recentActivity.length ? (
              metrics.recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <p>{item.message}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {item.actor} - {new Date(item.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-[var(--color-muted)]">
                No recent activity.
              </li>
            )}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </Card>
  );
}
