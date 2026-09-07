import {
  type RangePreset,
  windowStartForPreset,
} from "@/lib/dates";
import { isCreditType } from "@/lib/account-type";
import { locfAmountAsOf, locfRateAsOf } from "@/lib/locf";
import {
  convertOtherMinorToPrimaryMinor,
  creditDebtMinor,
  minorToMajorNumber,
} from "@/lib/money";
import {
  computeNetWorthRows,
  type NetWorthAccountType,
} from "@/lib/net-worth";

export type { RangePreset };

export type SeriesAccount = {
  id: number;
  type: NetWorthAccountType;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  creditLimitMinor: bigint | null;
};

export type SeriesSnapshot = {
  accountId: number;
  asOfDate: string;
  amountMinor: bigint;
};

export type SeriesRate = {
  currencyCode: string;
  asOfDate: string;
  rateToPrimaryScaled: bigint;
};

export type NetWorthSeriesPoint = {
  asOfDate: string;
  /** Authoritative LOCF total — keep BigInt in lib/tests. */
  totalPrimaryMinor: bigint;
  /** Chart Y major as number at client boundary (RESEARCH A1). */
  nw: number;
  /**
   * Per-account primary contribution majors keyed by `accountStackKey(id)`.
   * Credit debt contributes negative (same as computeNetWorthRows).
   * Excluded accounts (no balance / no FX) omit the key for that date.
   */
  stacks: Record<string, number>;
};

/** Stable Recharts dataKey for an account stack layer. */
export function accountStackKey(accountId: number): string {
  return `a${accountId}`;
}

export type BuildNetWorthSeriesInput = {
  accounts: SeriesAccount[];
  snapshots: SeriesSnapshot[];
  rates: SeriesRate[];
  primaryScale: number;
  preset: RangePreset;
  today: string;
};

/**
 * Sparse event∪today NW series: sample dates = balance events ∪ FX events for
 * non-primary currencies in play ∪ today, filtered to [windowStart, today].
 * Each point = LOCF balance × LOCF FX via computeNetWorthRows (CHART-03).
 * Partial days still emit a point; isPartial is ignored for marking (D-14).
 */
export function buildNetWorthSeries(
  input: BuildNetWorthSeriesInput,
): NetWorthSeriesPoint[] {
  const { accounts, snapshots, rates, primaryScale, preset, today } = input;
  if (accounts.length === 0) {
    return [];
  }

  const windowStart = windowStartForPreset(preset, today);
  const nonPrimaryCodes = new Set(
    accounts
      .filter((a) => !a.isPrimaryCurrency)
      .map((a) => a.currencyCode),
  );

  const dateSet = new Set<string>();
  for (const snap of snapshots) {
    dateSet.add(snap.asOfDate);
  }
  for (const rate of rates) {
    if (nonPrimaryCodes.has(rate.currencyCode)) {
      dateSet.add(rate.asOfDate);
    }
  }
  dateSet.add(today);

  const sampleDates = [...dateSet]
    .filter((d) => d <= today && (windowStart === null || d >= windowStart))
    .sort();

  return sampleDates.map((asOfDate) => {
    const nwInputs = accounts.map((account) => ({
      id: account.id,
      type: account.type,
      currencyCode: account.currencyCode,
      currencyScale: account.currencyScale,
      isPrimaryCurrency: account.isPrimaryCurrency,
      creditLimitMinor: account.creditLimitMinor,
      locfAmountMinor: locfAmountAsOf(snapshots, account.id, asOfDate),
      rateToPrimaryScaled: account.isPrimaryCurrency
        ? null
        : locfRateAsOf(rates, account.currencyCode, asOfDate),
      primaryScale,
    }));

    const { rows, totalPrimaryMinor } = computeNetWorthRows(nwInputs);
    const byId = new Map(rows.map((row) => [row.accountId, row]));
    const stacks: Record<string, number> = {};
    for (const account of accounts) {
      const row = byId.get(account.id);
      stacks[accountStackKey(account.id)] =
        row?.includedInTotal
          ? minorToMajorNumber(row.contributionPrimaryMinor, primaryScale)
          : 0;
    }
    return {
      asOfDate,
      totalPrimaryMinor,
      nw: minorToMajorNumber(totalPrimaryMinor, primaryScale),
      stacks,
    };
  });
}

export type AccountSeriesMode = "native" | "primary";

export type AccountSeriesPoint = {
  asOfDate: string;
  /** Chart Y major as number at client boundary (non-credit / available). */
  value: number;
  /** Authoritative LOCF amount — keep BigInt in lib/tests. */
  valueMinor: bigint;
  /** Credit stack majors (FIAT_CREDIT only) — both positive heights (D-11). */
  debt?: number;
  available?: number;
  debtMinor?: bigint;
  availableMinor?: bigint;
};

export type BuildAccountSeriesInput = {
  account: SeriesAccount;
  snapshots: SeriesSnapshot[];
  rates: SeriesRate[];
  primaryScale: number;
  preset: RangePreset;
  today: string;
  mode: AccountSeriesMode;
};

/**
 * Sparse per-account series (CHART-02).
 * Native: snapshot dates ∪ today; Y = native LOCF major.
 * Primary: snapshots ∪ FX dates for account currency ∪ today; convert via
 * LOCF rate (identity when primary currency). Skip when FX null (D-16).
 * Skip dates with no LOCF balance. Window via windowStartForPreset.
 * FIAT_CREDIT: emit debt+available stack (creditDebtMinor); both convert in
 * primary mode (D-11, D-12) — not NW debt-only contribution.
 */
export function buildAccountSeries(
  input: BuildAccountSeriesInput,
): AccountSeriesPoint[] {
  const { account, snapshots, rates, primaryScale, preset, today, mode } =
    input;

  const windowStart = windowStartForPreset(preset, today);
  const dateSet = new Set<string>();

  for (const snap of snapshots) {
    if (snap.accountId === account.id) {
      dateSet.add(snap.asOfDate);
    }
  }

  if (mode === "primary" && !account.isPrimaryCurrency) {
    for (const rate of rates) {
      if (rate.currencyCode === account.currencyCode) {
        dateSet.add(rate.asOfDate);
      }
    }
  }

  dateSet.add(today);

  const sampleDates = [...dateSet]
    .filter((d) => d <= today && (windowStart === null || d >= windowStart))
    .sort();

  const points: AccountSeriesPoint[] = [];

  for (const asOfDate of sampleDates) {
    const nativeMinor = locfAmountAsOf(snapshots, account.id, asOfDate);
    if (nativeMinor === null) {
      continue;
    }

    const isCredit =
      isCreditType(account.type) && account.creditLimitMinor != null;

    if (isCredit) {
      const availableMinor = nativeMinor;
      const debtMinor = creditDebtMinor(
        account.creditLimitMinor!,
        availableMinor,
      );

      if (mode === "native" || account.isPrimaryCurrency) {
        const scale = account.currencyScale;
        points.push({
          asOfDate,
          valueMinor: availableMinor,
          value: minorToMajorNumber(availableMinor, scale),
          availableMinor,
          debtMinor,
          available: minorToMajorNumber(availableMinor, scale),
          debt: minorToMajorNumber(debtMinor, scale),
        });
        continue;
      }

      const rate = locfRateAsOf(rates, account.currencyCode, asOfDate);
      if (rate === null) {
        continue; // D-16
      }

      const availablePrimary = convertOtherMinorToPrimaryMinor(
        availableMinor,
        rate,
        account.currencyScale,
        primaryScale,
      );
      const debtPrimary = convertOtherMinorToPrimaryMinor(
        debtMinor,
        rate,
        account.currencyScale,
        primaryScale,
      );
      points.push({
        asOfDate,
        valueMinor: availablePrimary,
        value: minorToMajorNumber(availablePrimary, primaryScale),
        availableMinor: availablePrimary,
        debtMinor: debtPrimary,
        available: minorToMajorNumber(availablePrimary, primaryScale),
        debt: minorToMajorNumber(debtPrimary, primaryScale),
      });
      continue;
    }

    if (mode === "native") {
      points.push({
        asOfDate,
        valueMinor: nativeMinor,
        value: minorToMajorNumber(nativeMinor, account.currencyScale),
      });
      continue;
    }

    // primary mode
    if (account.isPrimaryCurrency) {
      points.push({
        asOfDate,
        valueMinor: nativeMinor,
        value: minorToMajorNumber(nativeMinor, account.currencyScale),
      });
      continue;
    }

    const rate = locfRateAsOf(rates, account.currencyCode, asOfDate);
    if (rate === null) {
      continue; // D-16
    }

    const primaryMinor = convertOtherMinorToPrimaryMinor(
      nativeMinor,
      rate,
      account.currencyScale,
      primaryScale,
    );
    points.push({
      asOfDate,
      valueMinor: primaryMinor,
      value: minorToMajorNumber(primaryMinor, primaryScale),
    });
  }

  return points;
}
