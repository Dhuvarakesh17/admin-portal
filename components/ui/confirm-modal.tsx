"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmModal({
  triggerLabel,
  title,
  description,
  onConfirm,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  const id = useId();

  return (
    <>
      <button
        type="button"
        className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs"
        onClick={() => {
          const modal = document.getElementById(id) as HTMLDialogElement | null;
          modal?.showModal();
        }}
      >
        {triggerLabel}
      </button>
      <dialog id={id} className="rounded-xl p-0 backdrop:bg-black/30">
        <div className="w-[min(92vw,420px)] p-5">
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {description}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <form method="dialog">
              <Button variant="secondary">Cancel</Button>
            </form>
            <form
              method="dialog"
              onSubmit={(event) => {
                event.preventDefault();
                onConfirm();
                const modal = document.getElementById(
                  id,
                ) as HTMLDialogElement | null;
                modal?.close();
              }}
            >
              <Button variant="danger">Confirm</Button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
