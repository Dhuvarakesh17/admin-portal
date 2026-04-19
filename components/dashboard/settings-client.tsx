"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client-fetch";

interface SettingsPayload {
  teamsEnabled: boolean;
  emailTemplates: Array<{ key: string; name: string }>;
  departments: string[];
  tags: string[];
  apiHealth: "ok" | "degraded" | "down";
}

export function SettingsClient() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [newDepartment, setNewDepartment] = useState("");

  useEffect(() => {
    apiFetch<SettingsPayload>("/api/settings/health")
      .then(setSettings)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function addDepartment() {
    if (!newDepartment.trim()) return;
    const departments = [
      ...(settings?.departments ?? []),
      newDepartment.trim(),
    ];
    setSettings((prev) => (prev ? { ...prev, departments } : prev));
    setNewDepartment("");
    toast.success(
      "Department added locally. Persist to backend endpoint as needed.",
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage team, templates, taxonomies and integration health"
      />

      {loading ? (
        <Card>
          <p className="text-sm text-[var(--color-muted)]">
            Loading settings...
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-lg font-semibold">
              Team Management
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Role model currently supports a single admin account.
            </p>
            <Select className="mt-4" defaultValue="admin" disabled>
              <option value="admin">admin</option>
            </Select>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold">
              Email Templates
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(settings?.emailTemplates ?? []).map((item) => (
                <li
                  key={item.key}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-2"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold">
              Department and Tags
            </h2>
            <div className="mt-3 flex gap-2">
              <Input
                value={newDepartment}
                placeholder="Add department"
                onChange={(e) => setNewDepartment(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={addDepartment}>
                Add
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(settings?.departments ?? []).map((dep) => (
                <span
                  key={dep}
                  className="rounded-full bg-[var(--color-bg)] px-3 py-1 text-xs"
                >
                  {dep}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold">API Health</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Current state: <strong>{settings?.apiHealth ?? "unknown"}</strong>
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
