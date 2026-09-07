"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePerson } from "@/app/debts/actions";
import {
  IncomeFormDialog,
  type IncomeRow,
} from "@/components/income/IncomeFormDialog";
import { IncomeFactDialog } from "@/components/income/IncomeFactDialog";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAsOfDisplay } from "@/lib/dates";
import {
  incomeVarianceMinor,
  incomeVariancePhrase,
} from "@/lib/income";
import { formatMinorToMajor } from "@/lib/money";

type CurrencyOption = {
  code: string;
  name: string;
  scale: number;
};

export type PersonIncomeStatsDisplay = {
  nativeLines: { amount: string; currencyCode: string }[];
  primaryLine: { amount: string; currencyCode: string } | null;
  isPartial: boolean;
};

export type PersonIncomeListItem = {
  id: number;
  name: string;
  debtCount: number;
  incomeCount: number;
  incomes: IncomeRow[];
  /** Present only when Person has ≥1 actual (D-03). */
  stats?: PersonIncomeStatsDisplay;
};

const BLOCKED_DELETE_MESSAGE =
  "Нельзя удалить человека, пока есть долги или доходы";

const KIND_LABELS: Record<"recurring" | "oneTime", string> = {
  recurring: "Ежемесячный",
  oneTime: "Разовый",
};

function formatSignedDelta(deltaMinor: bigint, scale: number): string {
  const abs = formatMinorToMajor(
    deltaMinor < 0n ? -deltaMinor : deltaMinor,
    scale,
  );
  if (deltaMinor > 0n) return `+${abs}`;
  if (deltaMinor < 0n) return `−${abs}`;
  return abs;
}

function IncomeCompactRow({ income }: { income: IncomeRow }) {
  const scale = income.currency.scale;
  const planAmount = formatMinorToMajor(
    BigInt(income.plannedAmountMinor),
    scale,
  );
  const showOneTimeFilled =
    income.kind === "oneTime" &&
    income.hasActual &&
    income.actualAmountMinor != null;

  let varianceChrome: {
    actual: string;
    delta: string;
    phrase: string;
    deltaZero: boolean;
  } | null = null;
  if (showOneTimeFilled && income.actualAmountMinor != null) {
    const delta = incomeVarianceMinor(
      BigInt(income.actualAmountMinor),
      BigInt(income.plannedAmountMinor),
    );
    varianceChrome = {
      actual: formatMinorToMajor(BigInt(income.actualAmountMinor), scale),
      delta: formatSignedDelta(delta, scale),
      phrase: incomeVariancePhrase(delta),
      deltaZero: delta === 0n,
    };
  }

  const factTrigger = income.hasActual ? (
    <Button type="button" variant="outline" size="sm">
      Изменить факт
    </Button>
  ) : income.overdue ? (
    <Button type="button" size="sm">
      Заполни
    </Button>
  ) : (
    <Button type="button" variant="outline" size="sm">
      Внести факт
    </Button>
  );

  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <span className="text-sm text-muted-foreground">
            {KIND_LABELS[income.kind]}
          </span>
          {income.overdue ? (
            <span className="rounded-md bg-warning/15 px-2 py-1 text-sm font-semibold text-warning-foreground">
              заполни
            </span>
          ) : null}
          {showOneTimeFilled ? (
            <span className="text-sm font-semibold text-muted-foreground">
              получено
            </span>
          ) : null}
          <span className="font-mono text-base text-foreground">
            {planAmount}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {income.currencyCode}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {formatAsOfDisplay(income.nextPlannedAsOf)}
          </span>
          {varianceChrome ? (
            <>
              <span className="font-mono text-sm text-foreground">
                факт {varianceChrome.actual}
              </span>
              <span
                className={
                  varianceChrome.deltaZero
                    ? "font-mono text-sm text-muted-foreground"
                    : "font-mono text-sm text-foreground"
                }
              >
                Δ {varianceChrome.delta} {varianceChrome.phrase}
              </span>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <IncomeFactDialog income={income} trigger={factTrigger} />
          <IncomeFormDialog
            mode="edit"
            income={income}
            trigger={
              <Button type="button" variant="outline" size="sm">
                Изменить
              </Button>
            }
          />
        </div>
      </div>
    </li>
  );
}

function PersonGroup({
  person,
  currencies,
  peopleOptions,
  primaryCurrencyCode,
}: {
  person: PersonIncomeListItem;
  currencies: CurrencyOption[];
  peopleOptions: { id: number; name: string }[];
  primaryCurrencyCode: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-3">
        <p className="min-w-0 flex-1 break-all text-base font-medium text-foreground">
          {person.name}
        </p>
        {person.stats ? (
          <div className="flex shrink-0 flex-col items-end gap-2 text-right">
            <p className="text-sm text-muted-foreground">за всё время</p>
            <div className="flex flex-col items-end gap-1">
              {person.stats.nativeLines.map((line) => (
                <p
                  key={line.currencyCode}
                  className="font-mono text-base font-semibold text-foreground"
                >
                  {line.amount}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {line.currencyCode}
                  </span>
                </p>
              ))}
              {person.stats.primaryLine ? (
                <p className="font-mono text-sm text-muted-foreground">
                  {person.stats.primaryLine.amount}{" "}
                  {person.stats.primaryLine.currencyCode}
                </p>
              ) : null}
            </div>
            {person.stats.isPartial ? (
              <p className="text-sm text-foreground" role="status">
                <span className="font-semibold">Итог неполный</span>
                <span className="text-muted-foreground"> · нет курса</span>
              </p>
            ) : null}
          </div>
        ) : null}
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

      {person.incomes.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border-t border-border bg-muted/30 px-4 py-4">
          <p className="text-base text-muted-foreground">Нет доходов</p>
          <IncomeFormDialog
            mode="create"
            currencies={currencies}
            people={peopleOptions}
            primaryCurrencyCode={primaryCurrencyCode}
            defaultPersonId={person.id}
            trigger={
              <Button type="button" size="sm">
                Новый доход
              </Button>
            }
          />
        </div>
      ) : (
        <ul>
          {person.incomes.map((income) => (
            <IncomeCompactRow
              key={`${income.kind}-${income.id}`}
              income={income}
            />
          ))}
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

export function IncomeList({
  people,
  currencies,
  primaryCurrencyCode,
}: {
  people: PersonIncomeListItem[];
  currencies: CurrencyOption[];
  primaryCurrencyCode: string;
}) {
  const peopleOptions = people.map((p) => ({ id: p.id, name: p.name }));

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8">
        <div className="grid gap-2">
          <h2 className="text-base font-semibold text-foreground">Нет людей</h2>
          <p className="max-w-prose text-base text-muted-foreground">
            Добавьте человека или создайте доход, чтобы вести учёт.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PersonFormDialog
            mode="create"
            trigger={<Button type="button">Новый человек</Button>}
          />
          <IncomeFormDialog
            mode="create"
            currencies={currencies}
            people={[]}
            primaryCurrencyCode={primaryCurrencyCode}
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
          primaryCurrencyCode={primaryCurrencyCode}
        />
      ))}
    </ul>
  );
}
