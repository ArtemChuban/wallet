/**
 * Demo seed for local chart / dashboard smoke.
 * Wipes money tables and inserts RUB primary + multi-account history.
 *
 * Usage: npm run db:seed
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { calendarDateToday, addCalendarDays } from "../src/lib/dates";
import { RATE_SCALE_E8 } from "../src/lib/money";

const url = process.env.DATABASE_URL ?? "file:./data/wallet.db";
const adapter = new PrismaBetterSqlite3({ url, timeout: 5000 });
const prisma = new PrismaClient({ adapter });

function rate(primaryPerOther: number): bigint {
  return BigInt(Math.round(primaryPerOther * Number(RATE_SCALE_E8)));
}

async function main() {
  const today = calendarDateToday("Europe/Moscow");
  const d = (daysAgo: number) => addCalendarDays(today, -daysAgo);

  await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");

  // Child → parent wipe (FK Restrict)
  await prisma.balanceSnapshot.deleteMany();
  await prisma.fxRate.deleteMany();
  await prisma.account.deleteMany();
  await prisma.currency.deleteMany();

  await prisma.currency.createMany({
    data: [
      { code: "RUB", name: "Российский рубль", scale: 2, isPrimary: true },
      { code: "USD", name: "Доллар США", scale: 2, isPrimary: false },
      { code: "BTC", name: "Bitcoin", scale: 8, isPrimary: false },
    ],
  });

  const tinkoff = await prisma.account.create({
    data: {
      name: "Тинькофф рублёвый",
      type: "FIAT_DEBIT",
      currencyCode: "RUB",
    },
  });
  const usdBroker = await prisma.account.create({
    data: {
      name: "Interactive Brokers USD",
      type: "FIAT_DEBIT",
      currencyCode: "USD",
    },
  });
  const credit = await prisma.account.create({
    data: {
      name: "Кредитка Альфа",
      type: "FIAT_CREDIT",
      currencyCode: "RUB",
      creditLimitMinor: 300_000_00n, // 300_000.00 RUB
    },
  });
  const cash = await prisma.account.create({
    data: {
      name: "Наличные",
      type: "CASH",
      currencyCode: "RUB",
    },
  });
  const btc = await prisma.account.create({
    data: {
      name: "Bitcoin холодный",
      type: "CRYPTO",
      currencyCode: "BTC",
    },
  });

  // FX: USD and BTC vs RUB over the window (CHART-03: later rate must not rewrite earlier points)
  await prisma.fxRate.createMany({
    data: [
      { currencyCode: "USD", asOfDate: d(50), rateToPrimaryScaled: rate(90) },
      { currencyCode: "USD", asOfDate: d(30), rateToPrimaryScaled: rate(92) },
      { currencyCode: "USD", asOfDate: d(10), rateToPrimaryScaled: rate(95) },
      { currencyCode: "BTC", asOfDate: d(45), rateToPrimaryScaled: rate(6_500_000) },
      { currencyCode: "BTC", asOfDate: d(20), rateToPrimaryScaled: rate(7_200_000) },
      { currencyCode: "BTC", asOfDate: d(5), rateToPrimaryScaled: rate(7_800_000) },
    ],
  });

  await prisma.balanceSnapshot.createMany({
    data: [
      // Tinkoff RUB
      { accountId: tinkoff.id, asOfDate: d(55), amountMinor: 450_000_00n },
      { accountId: tinkoff.id, asOfDate: d(25), amountMinor: 520_000_00n },
      { accountId: tinkoff.id, asOfDate: d(7), amountMinor: 480_000_00n },
      // USD broker
      { accountId: usdBroker.id, asOfDate: d(40), amountMinor: 2_500_00n },
      { accountId: usdBroker.id, asOfDate: d(15), amountMinor: 3_100_00n },
      // Credit: available remaining (limit 300k)
      { accountId: credit.id, asOfDate: d(35), amountMinor: 280_000_00n },
      { accountId: credit.id, asOfDate: d(12), amountMinor: 210_000_00n },
      // Cash
      { accountId: cash.id, asOfDate: d(60), amountMinor: 25_000_00n },
      { accountId: cash.id, asOfDate: d(3), amountMinor: 18_000_00n },
      // BTC (0.05 → 0.08)
      { accountId: btc.id, asOfDate: d(48), amountMinor: 5_000_000n },
      { accountId: btc.id, asOfDate: d(8), amountMinor: 8_000_000n },
    ],
  });

  console.log(`Seeded demo wallet for today=${today}`);
  console.log(
    `Accounts: ${tinkoff.name}, ${usdBroker.name}, ${credit.name}, ${cash.name}, ${btc.name}`,
  );
  console.log("Run: npm run dev → open /");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
