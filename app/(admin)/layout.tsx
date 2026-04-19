import { requireSession } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <AdminShell>{children}</AdminShell>;
}
