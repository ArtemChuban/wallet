-- CreateTable
CREATE TABLE "Currency" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scale" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "FxRateStub" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "currencyCode" TEXT NOT NULL,
    "asOfDate" TEXT NOT NULL,
    "rateToPrimaryScaled" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "BalanceAmountStub" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amountMinor" BIGINT NOT NULL
);
