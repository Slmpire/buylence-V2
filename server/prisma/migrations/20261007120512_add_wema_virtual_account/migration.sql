/*
  Warnings:

  - A unique constraint covering the columns `[virtualAccount]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wemaSessionId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'WEMA_TRANSFER';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "virtualAccount" TEXT,
ADD COLUMN     "wemaSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_virtualAccount_key" ON "orders"("virtualAccount");

-- CreateIndex
CREATE UNIQUE INDEX "orders_wemaSessionId_key" ON "orders"("wemaSessionId");
