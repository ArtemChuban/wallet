"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import {
  createOneTimeIncome,
  createRecurringIncome,
  deleteOneTimeIncome,
  deleteRecurringIncome,
  updateOneTimeIncome,
  updateRecurringIncome,
  type IncomeActionState,
} from "@/app/income/actions";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calendarDateToday } from "@/lib/dates";
import { formatMinorToMajor } from "@/lib/money";

type CurrencyOption = {
  code: string;
  name: string;
  scale: number;
};

type PersonOption = {
  id: number;
  name: string;
};

export type IncomeRow = {
  id: number;
  kind: "recurring" | "oneTime";
  currencyCode: string;
  /** Serialized BigInt string from RSC. */
  plannedAmountMinor: string;
  dayOfMonth: number | null;
  startAsOf: string | null;
  plannedAsOf: string | null;
  note: string | null;
  nextPlannedAsOf: string;
  /** Next-open (recurring) / plan-key (one-time) has an actual fact. */
  hasActual: boolean;
  /** isIncomeOverdue(nextPlannedAsOf, hasActual, Moscow today) — Plan 03 chrome. */
  overdue: boolean;
  actualId?: number;
  /** Serialized BigInt string from RSC when hasActual. */
  actualAmountMinor?: string;
  actualAsOf?: string;
  currency: { code: string; name: string; scale: number };
  person: { id: number; name: string };
};

type IncomeFormDialogProps =
  | {
      mode: "create";
      currencies: CurrencyOption[];
      people: PersonOption[];
      primaryCurrencyCode: string;
      defaultPersonId?: number;
      income?: undefined;
      trigger?: ReactElement;
    }
  | {
      mode: "edit";
      income: IncomeRow;
      currencies?: CurrencyOption[];
      people?: PersonOption[];
      primaryCurrencyCode?: string;
      defaultPersonId?: undefined;
      trigger?: ReactElement;
    };

const initialState: IncomeActionState = {};

const KIND_LABELS: Record<"recurring" | "oneTime", string> = {
  recurring: "Ежемесячный",
  oneTime: "Разовый",
};

const INCOME_DELETE_CONFIRM =
  "Удалить доход? Будут удалены план и все связанные факты получения. Это нельзя отменить.";

function createIncomeAction(
  prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const kind = String(formData.get("kind") ?? "recurring");
  if (kind === "oneTime") {
    return createOneTimeIncome(prev, formData);
  }
  return createRecurringIncome(prev, formData);
}

function updateIncomeAction(
  prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const kind = String(formData.get("kind") ?? "recurring");
  if (kind === "oneTime") {
    return updateOneTimeIncome(prev, formData);
  }
  return updateRecurringIncome(prev, formData);
}

function IncomeFormBody({
  mode,
  income,
  currencies,
  people,
  primaryCurrencyCode,
  defaultPersonId,
  onSuccess,
}: {
  mode: "create" | "edit";
  income?: IncomeRow;
  currencies: CurrencyOption[];
  people: PersonOption[];
  primaryCurrencyCode: string;
  defaultPersonId?: number;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"form" | "confirm-delete">("form");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const initialPersonMode: "existing" | "new" =
    mode === "create" && people.length === 0 ? "new" : "existing";
  const [personMode, setPersonMode] = useState<"existing" | "new">(
    initialPersonMode,
  );
  const [personId, setPersonId] = useState<string>(() => {
    if (mode !== "create") return "";
    if (
      defaultPersonId != null &&
      people.some((p) => p.id === defaultPersonId)
    ) {
      return String(defaultPersonId);
    }
    return people[0] ? String(people[0].id) : "";
  });
  const [kind, setKind] = useState<"recurring" | "oneTime">(
    mode === "edit" && income ? income.kind : "recurring",
  );
  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    if (mode === "edit" && income) return income.currencyCode;
    if (
      primaryCurrencyCode &&
      currencies.some((c) => c.code === primaryCurrencyCode)
    ) {
      return primaryCurrencyCode;
    }
    return currencies[0]?.code ?? "";
  });
  const [newPersonName, setNewPersonName] = useState("");
  const [startAsOf, setStartAsOf] = useState(() =>
    mode === "edit" && income?.startAsOf
      ? income.startAsOf
      : calendarDateToday("Europe/Moscow"),
  );
  const [plannedAsOf, setPlannedAsOf] = useState(() =>
    mode === "edit" && income?.plannedAsOf
      ? income.plannedAsOf
      : calendarDateToday("Europe/Moscow"),
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    mode === "edit" && income?.dayOfMonth != null
      ? String(income.dayOfMonth)
      : "1",
  );
  const [amountMajor, setAmountMajor] = useState(() => {
    if (mode === "edit" && income) {
      return formatMinorToMajor(
        BigInt(income.plannedAmountMinor),
        income.currency.scale,
      );
    }
    return "";
  });
  const [note, setNote] = useState(
    mode === "edit" && income?.note ? income.note : "",
  );

  const action = mode === "create" ? createIncomeAction : updateIncomeAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const title = mode === "create" ? "Новый доход" : "Изменить доход";
  const description =
    mode === "create"
      ? "Тип, валюта и человек нельзя изменить после создания."
      : "Можно изменить сумму, расписание и заметку.";
  const submitLabel =
    mode === "create" ? "Создать доход" : "Сохранить изменения";

  function handleConfirmDelete() {
    if (!income) return;
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(income.id));
      const result =
        income.kind === "recurring"
          ? await deleteRecurringIncome(formData)
          : await deleteOneTimeIncome(formData);
      if (!result.success) {
        setDeleteError(
          result.message ?? "Не удалось удалить. Попробуйте снова.",
        );
        setStep("form");
        return;
      }
      onSuccess();
    });
  }

  if (step === "confirm-delete") {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Удалить доход</DialogTitle>
        </DialogHeader>
        <DestructiveConfirmStep
          message={INCOME_DELETE_CONFIRM}
          confirmLabel="Удалить доход"
          pending={isDeleting}
          onConfirm={handleConfirmDelete}
          onBack={() => setStep("form")}
        />
      </div>
    );
  }

  const editKind = mode === "edit" && income ? income.kind : kind;

  return (
    <form action={formAction} className="grid min-w-0 gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {mode === "edit" && income ? (
        <>
          <input type="hidden" name="id" value={income.id} />
          <input type="hidden" name="kind" value={income.kind} />
        </>
      ) : (
        <input type="hidden" name="kind" value={kind} />
      )}

      {mode === "create" ? (
        <div className="grid gap-2">
          <Label>Тип</Label>
          <Select
            value={kind}
            onValueChange={(value) => {
              if (value === "recurring" || value === "oneTime") setKind(value);
            }}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  value
                    ? (KIND_LABELS[value as "recurring" | "oneTime"] ?? value)
                    : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Ежемесячный</SelectItem>
              <SelectItem value="oneTime">Разовый</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="grid gap-2">
          <Label>Тип</Label>
          <p className="text-sm text-muted-foreground">
            {KIND_LABELS[editKind]}
          </p>
        </div>
      )}

      {mode === "create" ? (
        <div className="grid gap-2">
          <Label>Человек</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={personMode === "existing" ? "default" : "outline"}
              disabled={isPending || people.length === 0}
              onClick={() => setPersonMode("existing")}
            >
              Существующий
            </Button>
            <Button
              type="button"
              size="sm"
              variant={personMode === "new" ? "default" : "outline"}
              disabled={isPending}
              onClick={() => setPersonMode("new")}
            >
              Новый человек
            </Button>
          </div>
          {personMode === "existing" ? (
            <>
              <input type="hidden" name="personId" value={personId} />
              <Select
                value={personId}
                onValueChange={(value) => {
                  if (value != null) setPersonId(String(value));
                }}
                disabled={isPending || people.length === 0}
              >
                <SelectTrigger
                  className="w-full min-w-0"
                  aria-invalid={Boolean(state.errors?.personId)}
                >
                  <SelectValue>
                    {(value: string | null) => {
                      if (!value) return null;
                      const p = people.find((x) => String(x.id) === value);
                      return p?.name ?? value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.personId?.[0] ? (
                <p className="text-sm text-destructive" role="alert">
                  {state.errors.personId[0]}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <Input
                id="income-new-person-name"
                name="name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                maxLength={120}
                autoComplete="off"
                placeholder="Имя"
                aria-invalid={Boolean(state.errors?.name)}
                disabled={isPending}
              />
              {state.errors?.name?.[0] ? (
                <p className="text-sm text-destructive" role="alert">
                  {state.errors.name[0]}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          <Label>Человек</Label>
          <p className="text-sm text-muted-foreground">{income?.person.name}</p>
        </div>
      )}

      {mode === "create" ? (
        <div className="grid gap-2">
          <Label>Валюта</Label>
          <input type="hidden" name="currencyCode" value={currencyCode} />
          <Select
            value={currencyCode}
            onValueChange={(value) => {
              if (value != null) setCurrencyCode(String(value));
            }}
            disabled={isPending || currencies.length === 0}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={Boolean(state.errors?.currencyCode)}
            >
              <SelectValue>{(value: string | null) => value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.currencyCode?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.currencyCode[0]}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-2">
          <Label>Валюта</Label>
          <p className="font-mono text-sm text-muted-foreground">
            {income?.currencyCode}
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="income-amount">Сумма</Label>
        <Input
          id="income-amount"
          name="plannedAmountMajor"
          inputMode="decimal"
          autoComplete="off"
          value={amountMajor}
          onChange={(e) => setAmountMajor(e.target.value)}
          aria-invalid={Boolean(state.errors?.plannedAmountMajor)}
          disabled={isPending}
        />
        {state.errors?.plannedAmountMajor?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.plannedAmountMajor[0]}
          </p>
        ) : null}
      </div>

      {editKind === "recurring" ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="income-dom">День месяца</Label>
            <Input
              id="income-dom"
              name="dayOfMonth"
              inputMode="numeric"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              aria-invalid={Boolean(state.errors?.dayOfMonth)}
              disabled={isPending}
            />
            {state.errors?.dayOfMonth?.[0] ? (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.dayOfMonth[0]}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="income-start">Начало с</Label>
            <Input
              id="income-start"
              name="startAsOf"
              type="date"
              value={startAsOf}
              onChange={(e) => setStartAsOf(e.target.value)}
              required
              aria-invalid={Boolean(state.errors?.startAsOf)}
              disabled={isPending}
            />
            {state.errors?.startAsOf?.[0] ? (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.startAsOf[0]}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="income-planned">Дата</Label>
          <Input
            id="income-planned"
            name="plannedAsOf"
            type="date"
            value={plannedAsOf}
            onChange={(e) => setPlannedAsOf(e.target.value)}
            required
            aria-invalid={Boolean(state.errors?.plannedAsOf)}
            disabled={isPending}
          />
          {state.errors?.plannedAsOf?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.plannedAsOf[0]}
            </p>
          ) : null}
        </div>
      )}

      {(mode === "edit" || editKind === "oneTime") && (
        <div className="grid gap-2">
          <Label htmlFor="income-note">Заметка</Label>
          <Input
            id="income-note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            autoComplete="off"
            aria-invalid={Boolean(state.errors?.note)}
            disabled={isPending}
          />
          {state.errors?.note?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.note[0]}
            </p>
          ) : null}
        </div>
      )}

      {state.message && !state.success ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      <DialogFooter className="flex-col gap-2 sm:flex-col">
        {mode === "edit" ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={isPending || isDeleting}
            onClick={() => {
              setDeleteError(null);
              setStep("confirm-delete");
            }}
          >
            Удалить доход
          </Button>
        ) : null}
        <div className="flex w-full flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>
            Не сохранять
          </DialogClose>
          <Button
            type="submit"
            disabled={
              isPending ||
              (mode === "create" &&
                (currencies.length === 0 ||
                  (personMode === "existing" && people.length === 0)))
            }
          >
            {isPending ? "Сохранение…" : submitLabel}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function IncomeFormDialog(props: IncomeFormDialogProps) {
  const { mode, trigger } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const currencies = props.mode === "create" ? props.currencies : [];
  const people = props.mode === "create" ? props.people : [];
  const primaryCurrencyCode =
    props.mode === "create"
      ? props.primaryCurrencyCode
      : (props.primaryCurrencyCode ?? props.income.currencyCode);

  const defaultTrigger =
    mode === "create" ? (
      <Button type="button">Новый доход</Button>
    ) : (
      <Button type="button" variant="outline" size="sm">
        Изменить
      </Button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="overflow-hidden sm:max-w-md">
        {open ? (
          <IncomeFormBody
            key={formKey}
            mode={mode}
            income={mode === "edit" ? props.income : undefined}
            currencies={
              mode === "create"
                ? currencies
                : props.income
                  ? [props.income.currency]
                  : []
            }
            people={people}
            primaryCurrencyCode={primaryCurrencyCode}
            defaultPersonId={
              mode === "create" ? props.defaultPersonId : undefined
            }
            onSuccess={() => {
              router.refresh();
              setOpen(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
