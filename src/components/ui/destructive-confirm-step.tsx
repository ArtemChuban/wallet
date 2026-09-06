"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

type DestructiveConfirmStepProps = {
  /** Second-step Russian loss copy. */
  message: string;
  /** Confirm button label (e.g. «Удалить человека»). */
  confirmLabel: string;
  backLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onBack: () => void;
};

/**
 * In-dialog second step for destructive actions (D-16).
 * Prefer this Dialog step over browser native confirm APIs.
 */
export function DestructiveConfirmStep({
  message,
  confirmLabel,
  backLabel = "Назад",
  pending = false,
  onConfirm,
  onBack,
}: DestructiveConfirmStepProps) {
  return (
    <div className="grid gap-4">
      <p className="text-base text-foreground">{message}</p>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onBack}
        >
          {backLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "Удаление…" : confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}
