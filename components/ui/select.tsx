import type { SelectHTMLAttributes } from "react";
import { classNames } from "@/lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={classNames("field text-sm", className)} {...props} />
  );
}
