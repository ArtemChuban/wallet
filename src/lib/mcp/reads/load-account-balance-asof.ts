import { getBalanceAsOf } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { getRateAsOf } from "@/lib/fx";
import { convertOtherMinorToPrimaryMinor } from "@/lib/money";
import { minorToJson } from "@/lib/mcp/serialize";

export type AccountBalanceExcludeReason =
  | "none"
  | "no_balance"
  | "no_fx"
  | "account_not_found";

export type AccountBalanceAccountInput = {
  name: string;
  type: string;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

export type SerializedAccountBalancePayload = {
  asOf: string;
  accountId: number;
  accountName: string | null;
  type: string | null;
  currencyCode: string | null;
  currencyScale: number | null;
  nativeAmountMinor: string | null;
  primaryAmountMinor: string | null;
  primaryScale: number | null;
  conversionOk: boolean;
  excludeReason?: AccountBalanceExcludeReason;
  error?: "account_not_found";
};

/**
 * Pure CAP-03 assembler — server convert only; D-11 honesty (conversionOk).
 * SQLite-free for adapter tests.
 */
export function assembleAccountBalancePayload(args: {
  asOf: string;
  accountId: number;
  account: AccountBalanceAccountInput | null;
  nativeAmountMinor: bigint | null;
  rateToPrimaryScaled: bigint | null;
  primaryScale: number;
}): SerializedAccountBalancePayload {
  const { asOf, accountId, account, nativeAmountMinor, rateToPrimaryScaled } =
    args;

  if (!account) {
    return {
      asOf,
      accountId,
      accountName: null,
      type: null,
      currencyCode: null,
      currencyScale: null,
      nativeAmountMinor: null,
      primaryAmountMinor: null,
      primaryScale: null,
      conversionOk: false,
      excludeReason: "account_not_found",
      error: "account_not_found",
    };
  }

  const base = {
    asOf,
    accountId,
    accountName: account.name,
    type: account.type,
    currencyCode: account.currencyCode,
    currencyScale: account.currencyScale,
    primaryScale: args.primaryScale,
  };

  if (nativeAmountMinor === null) {
    return {
      ...base,
      nativeAmountMinor: null,
      primaryAmountMinor: null,
      conversionOk: false,
      excludeReason: "no_balance",
    };
  }

  if (account.isPrimaryCurrency) {
    return {
      ...base,
      nativeAmountMinor: minorToJson(nativeAmountMinor),
      primaryAmountMinor: minorToJson(nativeAmountMinor),
      conversionOk: true,
      excludeReason: "none",
    };
  }

  if (rateToPrimaryScaled === null) {
    return {
      ...base,
      nativeAmountMinor: minorToJson(nativeAmountMinor),
      primaryAmountMinor: null,
      conversionOk: false,
      excludeReason: "no_fx",
    };
  }

  const primaryAmountMinor = convertOtherMinorToPrimaryMinor(
    nativeAmountMinor,
    rateToPrimaryScaled,
    account.currencyScale,
    args.primaryScale,
  );

  return {
    ...base,
    nativeAmountMinor: minorToJson(nativeAmountMinor),
    primaryAmountMinor: minorToJson(primaryAmountMinor),
    conversionOk: true,
    excludeReason: "none",
  };
}

/**
 * Single-account LOCF balance + server-side primary convert (CAP-03).
 */
export async function loadAccountBalanceAsOf(
  accountId: number,
  asOf: string,
): Promise<SerializedAccountBalancePayload> {
  await ensureSqlitePragmas();

  const [account, primaryCurrency] = await Promise.all([
    prisma.account.findUnique({
      where: { id: accountId },
      include: { currency: true },
    }),
    prisma.currency.findFirst({
      where: { isPrimary: true },
      select: { scale: true },
    }),
  ]);

  const primaryScale = primaryCurrency?.scale ?? 2;

  if (!account) {
    return assembleAccountBalancePayload({
      asOf,
      accountId,
      account: null,
      nativeAmountMinor: null,
      rateToPrimaryScaled: null,
      primaryScale,
    });
  }

  const snapshot = await getBalanceAsOf(accountId, asOf);
  const rate = account.currency.isPrimary
    ? null
    : await getRateAsOf(account.currencyCode, asOf);

  return assembleAccountBalancePayload({
    asOf,
    accountId,
    account: {
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      currencyScale: account.currency.scale,
      isPrimaryCurrency: account.currency.isPrimary,
    },
    nativeAmountMinor: snapshot?.amountMinor ?? null,
    rateToPrimaryScaled: rate?.rateToPrimaryScaled ?? null,
    primaryScale,
  });
}
