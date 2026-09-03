-- DropTable
DROP TABLE "FxRateStub";

-- CreateTable
CREATE TABLE "FxRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "currencyCode" TEXT NOT NULL,
    "asOfDate" TEXT NOT NULL,
    "rateToPrimaryScaled" BIGINT NOT NULL,
    CONSTRAINT "FxRate_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_currencyCode_asOfDate_key" ON "FxRate"("currencyCode", "asOfDate");
