import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface Column<T> {
  key: string;
  title: string;
  render: (item: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  emptyState,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyState?: ReactNode;
}) {
  if (!rows.length) {
    return <>{emptyState}</>;
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 font-semibold">
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-[var(--color-border)]/70"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 align-top">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
