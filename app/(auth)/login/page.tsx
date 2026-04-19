import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="panel w-full max-w-md p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Admin Login</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Sign in to manage jobs and candidate applications.
        </p>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
