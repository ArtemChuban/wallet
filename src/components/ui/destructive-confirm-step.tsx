"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

type DestructiveConfirmStepProps = {
  /** Second-step Russian loss copy. */
  message: string;
  /** Confirm button label (e.g. «Удалить человека»). */
  confirmLabel: string;
  backLabel?: string;
  pending?: boolean;
  /** Optional body between message and footer (e.g. close date field). */
  children?: ReactNode;
  /** Pending button label; defaults to «Удаление…». */
  pendingLabel?: string;
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
  children,
  pendingLabel,
  onConfirm,
  onBack,
}: DestructiveConfirmStepProps) {
  return (
    <div className="grid gap-4">
      <p className="text-base text-foreground">{message}</p>
      {children}
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
          {pending ? (pendingLabel ?? "Удаление…") : confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}
