import type { TextareaHTMLAttributes } from "react";
import { classNames } from "@/lib/utils";

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={classNames("field min-h-28 text-sm", className)}
      {...props}
    />
  );
}
