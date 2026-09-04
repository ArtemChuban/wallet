"use client";

import { useState, useTransition } from "react";
import { deletePerson } from "@/app/debts/actions";
import { DestructiveConfirmStep } from "@/components/debts/DestructiveConfirmStep";
import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PersonListItem = {
  id: number;
  name: string;
  debtCount: number;
};

const BLOCKED_DELETE_MESSAGE = "Нельзя удалить человека, пока есть долги";

/**
 * Stub trigger for Plan 03 DebtFormDialog — label/placement match UI-SPEC now.
 * `personId` reserved for group pre-select (D-12).
 */
export function NewDebtButton({
  personId: _personId,
  size = "default",
}: {
  personId?: number;
  size?: "default" | "sm";
}) {
  return (
    <Button type="button" size={size}>
      Новый долг
    </Button>
  );
}

function PersonGroup({ person }: { person: PersonListItem }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeleteClick() {
    setDeleteError(null);
    if (person.debtCount > 0) {
      setDeleteError(BLOCKED_DELETE_MESSAGE);
      return;
    }
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("personId", String(person.id));
      const result = await deletePerson(formData);
      if (!result.success) {
        setConfirmOpen(false);
        setDeleteError(
          result.message ?? "Не удалось удалить. Попробуйте снова.",
        );
        return;
      }
      setConfirmOpen(false);
    });
  }

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 break-words text-base font-medium text-foreground">
          {person.name}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <PersonFormDialog
            mode="edit"
            person={{ id: person.id, name: person.name }}
            trigger={
              <Button type="button" variant="outline" size="sm">
                Изменить имя
              </Button>
            }
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDeleteClick}
          >
            Удалить человека
          </Button>
        </div>
      </div>
      {deleteError ? (
        <p className="px-4 pb-3 text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      {person.debtCount === 0 ? (
        <div className="flex flex-col items-start gap-3 border-t border-border bg-muted/30 px-4 py-4">
          <p className="text-base text-muted-foreground">Нет долгов</p>
          <NewDebtButton personId={person.id} size="sm" />
        </div>
      ) : null}

      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!isPending) setConfirmOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>Удалить человека</DialogTitle>
          </DialogHeader>
          <DestructiveConfirmStep
            message={`Удалить человека «${person.name}»? Это нельзя отменить.`}
            confirmLabel="Удалить человека"
            pending={isPending}
            onConfirm={handleConfirmDelete}
            onBack={() => setConfirmOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </li>
  );
}

export function DebtsList({ people }: { people: PersonListItem[] }) {
  if (people.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8">
        <div className="grid gap-2">
          <h2 className="text-base font-semibold text-foreground">Нет людей</h2>
          <p className="max-w-prose text-base text-muted-foreground">
            Добавьте человека или создайте долг, чтобы вести учёт.
          </p>
        </div>
        <PersonFormDialog mode="create" />
      </div>
    );
  }

  return (
    <ul className="rounded-lg border border-border bg-background">
      {people.map((person) => (
        <PersonGroup key={person.id} person={person} />
      ))}
    </ul>
  );
}
