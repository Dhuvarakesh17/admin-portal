import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <div className="py-8 text-center">
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
      </div>
    </Card>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <Card>
      <div className="animate-pulse py-8 text-center text-sm text-[var(--color-muted)]">
        {label}
      </div>
    </Card>
  );
}

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <div className="py-8 text-center">
        <h3 className="text-lg font-semibold text-[var(--color-danger)]">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
      </div>
    </Card>
  );
}
