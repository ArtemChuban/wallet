import {
  type RangePreset,
  windowStartForPreset,
} from "@/lib/dates";
import { convertOtherMinorToPrimaryMinor } from "@/lib/fx";
import { formatMinorToMajor } from "@/lib/money";
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
};

export type BuildNetWorthSeriesInput = {
  accounts: SeriesAccount[];
  snapshots: SeriesSnapshot[];
  rates: SeriesRate[];
  primaryScale: number;
  preset: RangePreset;
  today: string;
};

function locfAmountAsOf(
  snapshots: SeriesSnapshot[],
  accountId: number,
  asOfDate: string,
): bigint | null {
  let best: SeriesSnapshot | null = null;
  for (const snap of snapshots) {
    if (snap.accountId !== accountId) continue;
    if (snap.asOfDate > asOfDate) continue;
    if (!best || snap.asOfDate > best.asOfDate) {
      best = snap;
    }
  }
  return best?.amountMinor ?? null;
}

function locfRateAsOf(
  rates: SeriesRate[],
  currencyCode: string,
  asOfDate: string,
): bigint | null {
  let best: SeriesRate | null = null;
  for (const rate of rates) {
    if (rate.currencyCode !== currencyCode) continue;
    if (rate.asOfDate > asOfDate) continue;
    if (!best || rate.asOfDate > best.asOfDate) {
      best = rate;
    }
  }
  return best?.rateToPrimaryScaled ?? null;
}

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

    const { totalPrimaryMinor } = computeNetWorthRows(nwInputs);
    return {
      asOfDate,
      totalPrimaryMinor,
      nw: Number(formatMinorToMajor(totalPrimaryMinor, primaryScale)),
    };
  });
}

export type AccountSeriesMode = "native" | "primary";

export type AccountSeriesPoint = {
  asOfDate: string;
  /** Chart Y major as number at client boundary. */
  value: number;
  /** Authoritative LOCF amount — keep BigInt in lib/tests. */
  valueMinor: bigint;
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
 * Credit stack fields deferred to Plan 03.
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

    if (mode === "native") {
      points.push({
        asOfDate,
        valueMinor: nativeMinor,
        value: Number(
          formatMinorToMajor(nativeMinor, account.currencyScale),
        ),
      });
      continue;
    }

    // primary mode
    if (account.isPrimaryCurrency) {
      points.push({
        asOfDate,
        valueMinor: nativeMinor,
        value: Number(
          formatMinorToMajor(nativeMinor, account.currencyScale),
        ),
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
      value: Number(formatMinorToMajor(primaryMinor, primaryScale)),
    });
  }

  return points;
}
