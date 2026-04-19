"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { classNames } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/applications", label: "Applications", icon: UsersRound },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (!res.ok) {
      toast.error("Unable to log out");
      return;
    }

    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="admin-shell grid min-h-screen grid-cols-1 lg:grid-cols-[250px_1fr]">
      <aside className="border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
        <div className="mb-8">
          <p className="font-display text-xl font-bold text-[var(--color-primary)]">
            JB Admin
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            Hiring Operations Console
          </p>
        </div>

        <nav className="space-y-2" aria-label="Main navigation">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-ink)] hover:bg-[var(--color-bg-soft)]",
                )}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-8 flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <main className="px-3 py-4 md:px-6 md:py-6">{children}</main>
    </div>
  );
}
