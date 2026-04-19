import type { InputHTMLAttributes } from "react";
import { classNames } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={classNames("field text-sm", className)} {...props} />
  );
}
