import {
  convertOtherMinorToPrimaryMinor,
  creditDebtMinor,
} from "@/lib/money";
import { isCreditType } from "@/lib/account-type";

export type NetWorthAccountType =
  | "ASSET"
  | "FIAT_DEBIT"
  | "FIAT_CREDIT"
  | "CRYPTO"
  | "CASH";

export type NetWorthAccountInput = {
  id: number;
  type: NetWorthAccountType;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  creditLimitMinor: bigint | null;
  /** LOCF amountMinor; null = no snapshot (BAL-02). Credit: available remaining. */
  locfAmountMinor: bigint | null;
  /** LOCF rate for non-primary; null = no rate (FX-02 / D-15). Ignored when isPrimaryCurrency. */
  rateToPrimaryScaled: bigint | null;
  primaryScale: number;
};

export type NetWorthExcludeReason = "none" | "no_balance" | "no_fx";

export type NetWorthRow = {
  accountId: number;
  includedInTotal: boolean;
  excludeReason: NetWorthExcludeReason;
  /** Signed primary-minor contribution to hero total (0n if excluded). */
  contributionPrimaryMinor: bigint;
  /** For display: asset native balance or credit available (null if no LOCF). */
  nativeDisplayMinor: bigint | null;
  /** Credit only: debt in native minor (null if not credit or no LOCF). */
  debtNativeMinor: bigint | null;
  /** Primary column magnitude: asset converted balance OR credit debt in primary (null if N/A). */
  primaryDisplayMinor: bigint | null;
};

function toPrimaryMinor(
  account: NetWorthAccountInput,
  nativeMinor: bigint,
): bigint | null {
  if (account.isPrimaryCurrency) {
    return nativeMinor;
  }
  if (account.rateToPrimaryScaled === null) {
    return null;
  }
  return convertOtherMinorToPrimaryMinor(
    nativeMinor,
    account.rateToPrimaryScaled,
    account.currencyScale,
    account.primaryScale,
  );
}

export function computeNetWorthRows(accounts: NetWorthAccountInput[]): {
  rows: NetWorthRow[];
  totalPrimaryMinor: bigint;
  isPartial: boolean;
} {
  const rows = accounts.map((account) => rowFor(account));
  const totalPrimaryMinor = rows.reduce(
    (sum, row) => sum + row.contributionPrimaryMinor,
    0n,
  );
  const isPartial = rows.some((row) => !row.includedInTotal);
  return { rows, totalPrimaryMinor, isPartial };
}

function rowFor(account: NetWorthAccountInput): NetWorthRow {
  if (account.locfAmountMinor === null) {
    return {
      accountId: account.id,
      includedInTotal: false,
      excludeReason: "no_balance",
      contributionPrimaryMinor: 0n,
      nativeDisplayMinor: null,
      debtNativeMinor: null,
      primaryDisplayMinor: null,
    };
  }

  if (isCreditType(account.type)) {
    if (account.creditLimitMinor == null) {
      return {
        accountId: account.id,
        includedInTotal: false,
        excludeReason: "no_balance",
        contributionPrimaryMinor: 0n,
        nativeDisplayMinor: account.locfAmountMinor,
        debtNativeMinor: null,
        primaryDisplayMinor: null,
      };
    }
    const rawDebt = creditDebtMinor(
      account.creditLimitMinor,
      account.locfAmountMinor,
    );
    const debtNativeMinor = rawDebt < 0n ? 0n : rawDebt;
    const primaryDebt = toPrimaryMinor(account, debtNativeMinor);
    if (primaryDebt === null) {
      return {
        accountId: account.id,
        includedInTotal: false,
        excludeReason: "no_fx",
        contributionPrimaryMinor: 0n,
        nativeDisplayMinor: account.locfAmountMinor,
        debtNativeMinor,
        primaryDisplayMinor: null,
      };
    }
    return {
      accountId: account.id,
      includedInTotal: true,
      excludeReason: "none",
      contributionPrimaryMinor: -primaryDebt,
      nativeDisplayMinor: account.locfAmountMinor,
      debtNativeMinor,
      primaryDisplayMinor: primaryDebt,
    };
  }

  const primaryDisplayMinor = toPrimaryMinor(
    account,
    account.locfAmountMinor,
  );
  if (primaryDisplayMinor === null) {
    return {
      accountId: account.id,
      includedInTotal: false,
      excludeReason: "no_fx",
      contributionPrimaryMinor: 0n,
      nativeDisplayMinor: account.locfAmountMinor,
      debtNativeMinor: null,
      primaryDisplayMinor: null,
    };
  }

  return {
    accountId: account.id,
    includedInTotal: true,
    excludeReason: "none",
    contributionPrimaryMinor: primaryDisplayMinor,
    nativeDisplayMinor: account.locfAmountMinor,
    debtNativeMinor: null,
    primaryDisplayMinor,
  };
}
