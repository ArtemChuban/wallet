export type NetWorthAccountType =
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

const ASSET_TYPES = new Set<NetWorthAccountType>([
  "FIAT_DEBIT",
  "CRYPTO",
  "CASH",
]);

function excludedRow(
  accountId: number,
  reason: Exclude<NetWorthExcludeReason, "none">,
  nativeDisplayMinor: bigint | null = null,
): NetWorthRow {
  return {
    accountId,
    includedInTotal: false,
    excludeReason: reason,
    contributionPrimaryMinor: 0n,
    nativeDisplayMinor,
    debtNativeMinor: null,
    primaryDisplayMinor: null,
  };
}

function includedAssetRow(
  accountId: number,
  amountPrimaryMinor: bigint,
  nativeDisplayMinor: bigint,
): NetWorthRow {
  return {
    accountId,
    includedInTotal: true,
    excludeReason: "none",
    contributionPrimaryMinor: amountPrimaryMinor,
    nativeDisplayMinor,
    debtNativeMinor: null,
    primaryDisplayMinor: amountPrimaryMinor,
  };
}

/**
 * Pure NW aggregation. Tracer covers primary-currency asset identity;
 * credit sign, FX conversion, and no_fx exclusion land in Plan 01 Task 2.
 */
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
    return excludedRow(account.id, "no_balance");
  }

  if (ASSET_TYPES.has(account.type) && account.isPrimaryCurrency) {
    return includedAssetRow(
      account.id,
      account.locfAmountMinor,
      account.locfAmountMinor,
    );
  }

  // Incomplete on purpose: remaining cases (credit, non-primary FX) fail Task 2 RED.
  return includedAssetRow(
    account.id,
    account.locfAmountMinor,
    account.locfAmountMinor,
  );
}
