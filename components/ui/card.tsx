import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return <div className="panel p-4 md:p-5">{children}</div>;
}
