-- DropTable
DROP TABLE "BalanceAmountStub";

-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "asOfDate" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    CONSTRAINT "BalanceSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BalanceSnapshot_accountId_asOfDate_key" ON "BalanceSnapshot"("accountId", "asOfDate");
