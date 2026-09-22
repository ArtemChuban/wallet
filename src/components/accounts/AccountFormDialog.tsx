"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import {
  createAccount,
  updateAccount,
  type AccountActionState,
} from "@/app/accounts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import {
  accountTypeLabel,
  isCreditType,
  type AccountTypeSoft,
} from "@/lib/account-type";
import { formatMinorToMajor } from "@/lib/money";
import { formatBpsToPercentMajor } from "@/lib/savings-rate";

type CurrencyOption = {
  code: string;
  name: string;
  scale: number;
};

type AccountRow = {
  id: number;
  name: string;
  type: AccountTypeSoft;
  currencyCode: string;
  /** Serialized BigInt string from RSC. */
  creditLimitMinor: string | null;
  /** SAVINGS annual rate in bps; null for non-SAVINGS (page wiring may land in 27-04). */
  annualRateBps: number | null;
  /** SAVINGS accrual DOM 1–31; null for non-SAVINGS. */
  accrualDayOfMonth: number | null;
  currency: { code: string; name: string; scale: number };
};

type AccountFormDialogProps =
  | {
      mode: "create";
      currencies: CurrencyOption[];
      account?: undefined;
      trigger?: ReactElement;
    }
  | {
      mode: "edit";
      account: AccountRow;
      currencies: CurrencyOption[];
      trigger?: ReactElement;
    };

const initialState: AccountActionState = {};

const TYPE_OPTIONS = [
  { value: "ASSET", label: "Актив" },
  { value: "FIAT_CREDIT", label: "Кредитный" },
  { value: "SAVINGS", label: "Накопительный" },
] as const;

/** Edit unlock peers only — never FIAT_CREDIT (D-13). */
const CONVERT_TYPE_OPTIONS = [
  { value: "ASSET", label: "Актив" },
  { value: "SAVINGS", label: "Накопительный" },
] as const;

function AccountFormBody({
  mode,
  account,
  currencies,
  onSuccess,
}: {
  mode: "create" | "edit";
  account?: AccountRow;
  currencies: CurrencyOption[];
  onSuccess: () => void;
}) {
  const [accountType, setAccountType] = useState<string>(
    mode === "edit" && account ? account.type : "ASSET",
  );
  const [currencyCode, setCurrencyCode] = useState<string>(
    mode === "edit" && account
      ? account.currencyCode
      : (currencies[0]?.code ?? ""),
  );
  const [name, setName] = useState(
    mode === "edit" && account ? account.name : "",
  );
  const [annualRate, setAnnualRate] = useState(() => {
    if (
      mode === "edit" &&
      account &&
      account.type === "SAVINGS" &&
      account.annualRateBps != null
    ) {
      return formatBpsToPercentMajor(account.annualRateBps);
    }
    return "";
  });
  const [accrualDom, setAccrualDom] = useState(() => {
    if (
      mode === "edit" &&
      account &&
      account.type === "SAVINGS" &&
      account.accrualDayOfMonth != null
    ) {
      return String(account.accrualDayOfMonth);
    }
    return "";
  });

  const action = mode === "create" ? createAccount : updateAccount;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const title = mode === "create" ? "Новый счёт" : "Изменить счёт";
  const submitLabel = mode === "create" ? "Добавить счёт" : "Сохранить";
  const showCreditLimit = mode === "create" && isCreditType(accountType);
  // Draft gate for create and edit (D-05) — not frozen account?.type
  const showSavingsFields = accountType === "SAVINGS";
  // Exact ASSET|SAVINGS only — never isAssetType (D-01, D-13, D-14)
  const canConvertType =
    mode === "edit" &&
    account != null &&
    (account.type === "ASSET" || account.type === "SAVINGS");

  const editLimit =
    mode === "edit" &&
    account &&
    isCreditType(account.type) &&
    account.creditLimitMinor != null
      ? `${formatMinorToMajor(BigInt(account.creditLimitMinor), account.currency.scale)} ${account.currencyCode}`
      : null;

  const editDescription = canConvertType
    ? "Валюта не меняется."
    : "Тип и валюта не меняются.";

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Тип, валюта и кредитный лимит нельзя изменить после создания."
            : editDescription}
        </DialogDescription>
      </DialogHeader>

      {mode === "edit" && account ? (
        <input type="hidden" name="id" value={account.id} />
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="account-name">Название</Label>
        <Input
          id="account-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          autoComplete="off"
          aria-invalid={Boolean(state.errors?.name)}
          disabled={isPending}
        />
        {state.errors?.name?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label>Тип</Label>
        {mode === "create" || canConvertType ? (
          <>
            <input type="hidden" name="type" value={accountType} />
            <Select
              value={accountType}
              onValueChange={(value) => {
                if (value != null) {
                  const next = String(value);
                  setAccountType(next);
                  if (next !== "SAVINGS") {
                    setAnnualRate("");
                    setAccrualDom("");
                  }
                }
              }}
              disabled={isPending}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={Boolean(state.errors?.type)}
              >
                <SelectValue>
                  {(value: string | null) =>
                    value ? accountTypeLabel(value) : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(mode === "create" ? TYPE_OPTIONS : CONVERT_TYPE_OPTIONS).map(
                  (opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {account ? accountTypeLabel(account.type) : null}
          </p>
        )}
        {state.errors?.type?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.type[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label>Валюта</Label>
        {mode === "create" ? (
          <>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono">{c.code}</span>
                    <span className="text-muted-foreground"> — {c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <p className="font-mono text-sm text-muted-foreground">
            {account?.currencyCode}
          </p>
        )}
        {state.errors?.currencyCode?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.currencyCode[0]}
          </p>
        ) : null}
        {mode === "create" && currencies.length === 0 ? (
          <p className="text-sm text-muted-foreground" role="status">
            Сначала добавьте валюту
          </p>
        ) : null}
      </div>

      {showCreditLimit ? (
        <div className="grid gap-2">
          <Label htmlFor="credit-limit">Кредитный лимит</Label>
          <Input
            id="credit-limit"
            name="creditLimitMajor"
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={Boolean(state.errors?.creditLimitMajor)}
            disabled={isPending}
          />
          <p className="text-sm text-muted-foreground">
            в единицах выбранной валюты
          </p>
          {state.errors?.creditLimitMajor?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.creditLimitMajor[0]}
            </p>
          ) : null}
        </div>
      ) : null}

      {showSavingsFields ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="annual-rate">Годовой %</Label>
            <Input
              id="annual-rate"
              name="annualRatePercentMajor"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={Boolean(state.errors?.annualRatePercentMajor)}
              disabled={isPending}
            />
            {state.errors?.annualRatePercentMajor?.[0] ? (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.annualRatePercentMajor[0]}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accrual-dom">День начисления</Label>
            <Input
              id="accrual-dom"
              name="accrualDayOfMonth"
              value={accrualDom}
              onChange={(e) => setAccrualDom(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(state.errors?.accrualDayOfMonth)}
              disabled={isPending}
            />
            {state.errors?.accrualDayOfMonth?.[0] ? (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.accrualDayOfMonth[0]}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {mode === "edit" && editLimit ? (
        <div className="grid gap-2">
          <Label>Кредитный лимит</Label>
          <p className="font-mono text-sm text-muted-foreground">{editLimit}</p>
        </div>
      ) : null}

      {state.message && !state.success ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <DialogFooter>
        <Button
          type="submit"
          disabled={isPending || (mode === "create" && currencies.length === 0)}
        >
          {isPending ? "Сохранение…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AccountFormDialog(props: AccountFormDialogProps) {
  const { mode, currencies, trigger } = props;
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger =
    mode === "create" ? (
      <Button type="button">Добавить счёт</Button>
    ) : (
      <Button type="button" variant="outline">
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
          <AccountFormBody
            key={formKey}
            mode={mode}
            account={mode === "edit" ? props.account : undefined}
            currencies={currencies}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
