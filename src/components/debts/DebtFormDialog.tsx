"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import {
  createDebt,
  deleteDebt,
  updateDebtMeta,
  type DebtActionState,
} from "@/app/debts/actions";
import { DestructiveConfirmStep } from "@/components/debts/DestructiveConfirmStep";
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

export type DebtRow = {
  id: number;
  direction: "I_OWE" | "THEY_OWE";
  currencyCode: string;
  /** Serialized BigInt string from RSC. */
  initialAmountMinor: string;
  /** Serialized remainingMinor from RSC. */
  remainingMinor: string;
  dueDate: string | null;
  note: string | null;
  currency: { code: string; name: string; scale: number };
  person: { id: number; name: string };
};

type DebtFormDialogProps =
  | {
      mode: "create";
      currencies: CurrencyOption[];
      people: PersonOption[];
      /** Pre-select person when opened from a group CTA (D-12). */
      defaultPersonId?: number;
      debt?: undefined;
      trigger?: ReactElement;
    }
  | {
      mode: "edit";
      debt: DebtRow;
      currencies?: CurrencyOption[];
      people?: PersonOption[];
      defaultPersonId?: undefined;
      trigger?: ReactElement;
    };

const initialState: DebtActionState = {};

const DIRECTION_LABELS: Record<"I_OWE" | "THEY_OWE", string> = {
  I_OWE: "Я должен",
  THEY_OWE: "Мне должны",
};

const DEBT_DELETE_CONFIRM =
  "Удалить долг? Будут удалены долг и вся история погашений и изменений суммы. Это нельзя отменить.";

function DebtFormBody({
  mode,
  debt,
  currencies,
  people,
  defaultPersonId,
  onSuccess,
}: {
  mode: "create" | "edit";
  debt?: DebtRow;
  currencies: CurrencyOption[];
  people: PersonOption[];
  defaultPersonId?: number;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"form" | "confirm-delete">("form");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const initialPersonMode: "existing" | "new" =
    mode === "create" && people.length === 0
      ? "new"
      : "existing";
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
  const [direction, setDirection] = useState<string>(
    mode === "edit" && debt ? debt.direction : "I_OWE",
  );
  const [currencyCode, setCurrencyCode] = useState<string>(
    mode === "edit" && debt
      ? debt.currencyCode
      : (currencies[0]?.code ?? ""),
  );
  const [newPersonName, setNewPersonName] = useState("");
  const [dueDate, setDueDate] = useState(
    mode === "edit" && debt?.dueDate ? debt.dueDate : "",
  );
  const [note, setNote] = useState(
    mode === "edit" && debt?.note ? debt.note : "",
  );

  const action = mode === "create" ? createDebt : updateDebtMeta;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const title = mode === "create" ? "Новый долг" : "Изменить долг";
  const description =
    mode === "create"
      ? "Сумма, валюта и человек нельзя изменить после создания."
      : "Можно изменить направление, срок и заметку.";
  const submitLabel =
    mode === "create" ? "Создать долг" : "Сохранить изменения";

  const initialFormatted =
    mode === "edit" && debt
      ? `${formatMinorToMajor(BigInt(debt.initialAmountMinor), debt.currency.scale)} ${debt.currencyCode}`
      : null;

  function handleConfirmDelete() {
    if (!debt) return;
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("debtId", String(debt.id));
      const result = await deleteDebt(formData);
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
          <DialogTitle>Удалить долг</DialogTitle>
        </DialogHeader>
        <DestructiveConfirmStep
          message={DEBT_DELETE_CONFIRM}
          confirmLabel="Удалить долг"
          pending={isDeleting}
          onConfirm={handleConfirmDelete}
          onBack={() => setStep("form")}
        />
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {mode === "edit" && debt ? (
        <input type="hidden" name="debtId" value={debt.id} />
      ) : null}

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
                  className="w-full"
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
                id="debt-new-person-name"
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
          <p className="text-sm text-muted-foreground">
            {debt?.person.name}
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <Label>Направление</Label>
        <input type="hidden" name="direction" value={direction} />
        <Select
          value={direction}
          onValueChange={(value) => {
            if (value != null) setDirection(String(value));
          }}
          disabled={isPending}
        >
          <SelectTrigger
            className="w-full"
            aria-invalid={Boolean(state.errors?.direction)}
          >
            <SelectValue>
              {(value: string | null) =>
                value
                  ? (DIRECTION_LABELS[value as "I_OWE" | "THEY_OWE"] ?? value)
                  : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="I_OWE">Я должен</SelectItem>
            <SelectItem value="THEY_OWE">Мне должны</SelectItem>
          </SelectContent>
        </Select>
        {state.errors?.direction?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.direction[0]}
          </p>
        ) : null}
      </div>

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
              <SelectValue>
                {(value: string | null) => value}
              </SelectValue>
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
            {debt?.currencyCode}
          </p>
        </div>
      )}

      {mode === "create" ? (
        <div className="grid gap-2">
          <Label htmlFor="debt-initial">Сумма</Label>
          <Input
            id="debt-initial"
            name="initialAmountMajor"
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={Boolean(state.errors?.initialAmountMajor)}
            disabled={isPending}
          />
          {state.errors?.initialAmountMajor?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.initialAmountMajor[0]}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-2">
          <Label>Начальная сумма</Label>
          <p className="font-mono text-sm text-muted-foreground">
            {initialFormatted}
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="debt-due">Срок (необязательно)</Label>
        <Input
          id="debt-due"
          name="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-invalid={Boolean(state.errors?.dueDate)}
          disabled={isPending}
        />
        {state.errors?.dueDate?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.dueDate[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="debt-note">Заметка (необязательно)</Label>
        <Input
          id="debt-note"
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
            Удалить долг
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

export function DebtFormDialog(props: DebtFormDialogProps) {
  const { mode, trigger } = props;
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const currencies = props.mode === "create" ? props.currencies : [];
  const people = props.mode === "create" ? props.people : [];

  const defaultTrigger =
    mode === "create" ? (
      <Button type="button">Новый долг</Button>
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
      <DialogContent className="sm:max-w-md">
        {open ? (
          <DebtFormBody
            key={formKey}
            mode={mode}
            debt={mode === "edit" ? props.debt : undefined}
            currencies={
              mode === "create"
                ? currencies
                : props.debt
                  ? [props.debt.currency]
                  : []
            }
            people={people}
            defaultPersonId={
              mode === "create" ? props.defaultPersonId : undefined
            }
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
