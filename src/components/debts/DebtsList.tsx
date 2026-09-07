"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { deletePerson } from "@/app/debts/actions";
import { DebtDetailDialog } from "@/components/debts/DebtDetailDialog";
import {
  DebtFormDialog,
  type DebtRow,
} from "@/components/debts/DebtFormDialog";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMinorToMajor } from "@/lib/money";

type CurrencyOption = {
  code: string;
  name: string;
  scale: number;
};

export type PersonListItem = {
  id: number;
  name: string;
  debtCount: number;
  incomeCount: number;
  debts: DebtRow[];
};

const BLOCKED_DELETE_MESSAGE =
  "Нельзя удалить человека, пока есть долги или доходы";

const DIRECTION_LABELS: Record<"I_OWE" | "THEY_OWE", string> = {
  I_OWE: "Я должен",
  THEY_OWE: "Мне должны",
};

function DebtCompactRow({ debt }: { debt: DebtRow }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const remaining = formatMinorToMajor(
    BigInt(debt.remainingMinor),
    debt.currency.scale,
  );
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
      >
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <span className="text-sm text-muted-foreground">
            {DIRECTION_LABELS[debt.direction]}
          </span>
          <span className="font-mono text-base text-foreground">
            {remaining}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {debt.currencyCode}
          </span>
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DebtFormDialog
            mode="edit"
            debt={debt}
            trigger={
              <Button type="button" variant="outline" size="sm">
                Изменить
              </Button>
            }
          />
        </div>
      </div>
      <DebtDetailDialog
        debt={debt}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </li>
  );
}

function PersonGroup({
  person,
  currencies,
  peopleOptions,
}: {
  person: PersonListItem;
  currencies: CurrencyOption[];
  peopleOptions: { id: number; name: string }[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [closedOpen, setClosedOpen] = useState(false);
  const router = useRouter();

  const openDebts = person.debts.filter((d) => d.status !== "CLOSED");
  const closedDebts = person.debts.filter((d) => d.status === "CLOSED");

  function handleDeleteClick() {
    setDeleteError(null);
    if (person.debtCount > 0 || person.incomeCount > 0) {
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
      router.refresh();
    });
  }

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 break-all text-base font-medium text-foreground">
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

      {person.debts.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border-t border-border bg-muted/30 px-4 py-4">
          <p className="text-base text-muted-foreground">Нет долгов</p>
          <DebtFormDialog
            mode="create"
            currencies={currencies}
            people={peopleOptions}
            defaultPersonId={person.id}
            trigger={
              <Button type="button" size="sm">
                Новый долг
              </Button>
            }
          />
        </div>
      ) : (
        <ul>
          {openDebts.map((debt) => (
            <DebtCompactRow key={debt.id} debt={debt} />
          ))}
          {closedDebts.length > 0 ? (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted/30"
                aria-expanded={closedOpen}
                onClick={() => setClosedOpen((v) => !v)}
              >
                {closedOpen ? (
                  <ChevronDown className="size-4 shrink-0" aria-hidden />
                ) : (
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                )}
                <span>Закрытые ({closedDebts.length})</span>
              </button>
              {closedOpen ? (
                <ul>
                  {closedDebts.map((debt) => (
                    <DebtCompactRow key={debt.id} debt={debt} />
                  ))}
                </ul>
              ) : null}
            </li>
          ) : null}
        </ul>
      )}

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

export function DebtsList({
  people,
  currencies,
}: {
  people: PersonListItem[];
  currencies: CurrencyOption[];
}) {
  const peopleOptions = people.map((p) => ({ id: p.id, name: p.name }));

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8">
        <div className="grid gap-2">
          <h2 className="text-base font-semibold text-foreground">Нет людей</h2>
          <p className="max-w-prose text-base text-muted-foreground">
            Добавьте человека или создайте долг, чтобы вести учёт.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PersonFormDialog mode="create" />
          <DebtFormDialog
            mode="create"
            currencies={currencies}
            people={[]}
          />
        </div>
      </div>
    );
  }

  return (
    <ul className="rounded-lg border border-border bg-background">
      {people.map((person) => (
        <PersonGroup
          key={person.id}
          person={person}
          currencies={currencies}
          peopleOptions={peopleOptions}
        />
      ))}
    </ul>
  );
}
