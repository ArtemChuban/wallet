import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { firstHitLocfMap } from "@/lib/locf";
import {
  computeNetWorthRows,
  type NetWorthAccountInput,
  type NetWorthAccountType,
  type NetWorthRow,
} from "@/lib/net-worth";
import { minorToJson } from "@/lib/mcp/serialize";

export type NetWorthAccountMeta = {
  accountId: number;
  accountName: string;
  currencyCode: string;
  type: NetWorthAccountType;
  currencyScale: number;
};

export type SerializedNetWorthRow = {
  accountId: number;
  accountName: string;
  currencyCode: string;
  type: NetWorthAccountType;
  includedInTotal: boolean;
  excludeReason: NetWorthRow["excludeReason"];
  contributionPrimaryMinor: string;
  primaryScale: number;
  nativeDisplayMinor: string | null;
  currencyScale: number;
  debtNativeMinor: string | null;
  primaryDisplayMinor: string | null;
};

export type SerializedNetWorthPayload = {
  asOf: string;
  primaryCurrencyCode: string;
  primaryScale: number;
  totalPrimaryMinor: string;
  isPartial: boolean;
  rows: SerializedNetWorthRow[];
};

/**
 * Pure adapter: stringify computeNetWorthRows output + D-12 enrichment.
 * SQLite-free — used by CAP-02 tests and loadNetWorthAsOf.
 */
export function serializeNetWorthPayload(args: {
  asOf: string;
  primaryCurrencyCode: string;
  primaryScale: number;
  totalPrimaryMinor: bigint;
  isPartial: boolean;
  rows: NetWorthRow[];
  metaByAccountId: Map<number, NetWorthAccountMeta>;
}): SerializedNetWorthPayload {
  const { asOf, primaryCurrencyCode, primaryScale, totalPrimaryMinor, isPartial } =
    args;

  const rows: SerializedNetWorthRow[] = args.rows.map((row) => {
    const meta = args.metaByAccountId.get(row.accountId);
    const currencyScale = meta?.currencyScale ?? primaryScale;
    return {
      accountId: row.accountId,
      accountName: meta?.accountName ?? "",
      currencyCode: meta?.currencyCode ?? "",
      type: meta?.type ?? "ASSET",
      includedInTotal: row.includedInTotal,
      excludeReason: row.excludeReason,
      contributionPrimaryMinor: minorToJson(row.contributionPrimaryMinor)!,
      primaryScale,
      nativeDisplayMinor: minorToJson(row.nativeDisplayMinor),
      currencyScale,
      debtNativeMinor: minorToJson(row.debtNativeMinor),
      primaryDisplayMinor: minorToJson(row.primaryDisplayMinor),
    };
  });

  return {
    asOf,
    primaryCurrencyCode,
    primaryScale,
    totalPrimaryMinor: minorToJson(totalPrimaryMinor)!,
    isPartial,
    rows,
  };
}

/**
 * Page-parity NW as-of loader (Капитал LOCF batch; omit income/grace).
 * Calls computeNetWorthRows only — no twin inclusion math (T-24-02).
 */
export async function loadNetWorthAsOf(
  asOf: string,
): Promise<SerializedNetWorthPayload> {
  await ensureSqlitePragmas();

  const [accounts, primaryCurrency, snapshotsLte, ratesLte] =
    await Promise.all([
      prisma.account.findMany({
        include: { currency: true },
        orderBy: { name: "asc" },
      }),
      prisma.currency.findFirst({
        where: { isPrimary: true },
        select: { code: true, scale: true },
      }),
      prisma.balanceSnapshot.findMany({
        where: { asOfDate: { lte: asOf } },
        orderBy: { asOfDate: "desc" },
        select: {
          accountId: true,
          asOfDate: true,
          amountMinor: true,
        },
      }),
      prisma.fxRate.findMany({
        where: { asOfDate: { lte: asOf } },
        orderBy: { asOfDate: "desc" },
        select: {
          currencyCode: true,
          asOfDate: true,
          rateToPrimaryScaled: true,
        },
      }),
    ]);

  const locfByAccount = firstHitLocfMap(snapshotsLte, (s) => s.accountId);
  const locfByCurrency = firstHitLocfMap(ratesLte, (r) => r.currencyCode);

  const primaryCurrencyCode = primaryCurrency?.code ?? "RUB";
  const primaryScale = primaryCurrency?.scale ?? 2;

  const metaByAccountId = new Map<number, NetWorthAccountMeta>();
  const inputs: NetWorthAccountInput[] = accounts.map((account) => {
    const type = account.type as NetWorthAccountType;
    metaByAccountId.set(account.id, {
      accountId: account.id,
      accountName: account.name,
      currencyCode: account.currencyCode,
      type,
      currencyScale: account.currency.scale,
    });

    const locf = locfByAccount.get(account.id) ?? null;
    const rate = locfByCurrency.get(account.currencyCode) ?? null;
    return {
      id: account.id,
      type,
      currencyCode: account.currencyCode,
      currencyScale: account.currency.scale,
      isPrimaryCurrency: account.currency.isPrimary,
      creditLimitMinor: account.creditLimitMinor,
      locfAmountMinor: locf?.amountMinor ?? null,
      rateToPrimaryScaled: account.currency.isPrimary
        ? null
        : (rate?.rateToPrimaryScaled ?? null),
      primaryScale,
    };
  });

  const { rows, totalPrimaryMinor, isPartial } = computeNetWorthRows(inputs);

  return serializeNetWorthPayload({
    asOf,
    primaryCurrencyCode,
    primaryScale,
    totalPrimaryMinor,
    isPartial,
    rows,
    metaByAccountId,
  });
}
