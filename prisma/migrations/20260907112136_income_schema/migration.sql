-- CreateTable
CREATE TABLE "RecurringIncome" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personId" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "plannedAmountMinor" BIGINT NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "startAsOf" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringIncome_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringIncome_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringIncomeActual" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recurringIncomeId" INTEGER NOT NULL,
    "plannedAsOf" TEXT NOT NULL,
    "actualAsOf" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringIncomeActual_recurringIncomeId_fkey" FOREIGN KEY ("recurringIncomeId") REFERENCES "RecurringIncome" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OneTimeIncome" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personId" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "plannedAmountMinor" BIGINT NOT NULL,
    "plannedAsOf" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OneTimeIncome_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OneTimeIncome_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OneTimeIncomeActual" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "oneTimeIncomeId" INTEGER NOT NULL,
    "plannedAsOf" TEXT NOT NULL,
    "actualAsOf" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OneTimeIncomeActual_oneTimeIncomeId_fkey" FOREIGN KEY ("oneTimeIncomeId") REFERENCES "OneTimeIncome" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurringIncomeActual_recurringIncomeId_plannedAsOf_key" ON "RecurringIncomeActual"("recurringIncomeId", "plannedAsOf");

-- CreateIndex
CREATE UNIQUE INDEX "OneTimeIncomeActual_oneTimeIncomeId_plannedAsOf_key" ON "OneTimeIncomeActual"("oneTimeIncomeId", "plannedAsOf");
