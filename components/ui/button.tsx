import type { ButtonHTMLAttributes } from "react";
import { classNames } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      className={classNames(
        "inline-flex items-center justify-center text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "danger" &&
          "rounded-[10px] bg-[var(--color-danger)] px-4 py-2 text-white",
        className,
      )}
      {...props}
    />
  );
}
