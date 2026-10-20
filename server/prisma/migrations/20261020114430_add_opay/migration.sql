/*
  Warnings:

  - The values [WEMA_TRANSFER] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[opayRef]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('NOMBA', 'PAYSTACK', 'OPAY', 'PAY_ON_DELIVERY');
ALTER TABLE "orders" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "opayRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_opayRef_key" ON "orders"("opayRef");
