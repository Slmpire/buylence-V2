-- CreateTable: ProductUnit (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS "ProductUnit" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "comparePrice" INTEGER,
    "dealPrice" INTEGER,
    "dealEndsAt" TIMESTAMP(3),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductUnit_pkey" PRIMARY KEY ("id")
);

-- Add missing columns to ProductUnit if they were not in the original table
ALTER TABLE "ProductUnit"
    ADD COLUMN IF NOT EXISTS "dealPrice" INTEGER,
    ADD COLUMN IF NOT EXISTS "dealEndsAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "comparePrice" INTEGER,
    ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductUnit_productId_idx" ON "ProductUnit"("productId");

-- AddForeignKey for ProductUnit (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductUnit_productId_fkey'
    ) THEN
        ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: PaymentGroup
CREATE TABLE IF NOT EXISTS "PaymentGroup" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentGroup_reference_key" ON "PaymentGroup"("reference");
CREATE INDEX IF NOT EXISTS "PaymentGroup_buyerId_idx" ON "PaymentGroup"("buyerId");
CREATE INDEX IF NOT EXISTS "PaymentGroup_status_idx" ON "PaymentGroup"("status");

-- AlterTable: orders — add paymentGroupId and opayRef
ALTER TABLE "orders"
    ADD COLUMN IF NOT EXISTS "paymentGroupId" TEXT,
    ADD COLUMN IF NOT EXISTS "opayRef" TEXT;

-- CreateIndex for orders.paymentGroupId and orders.opayRef
CREATE INDEX IF NOT EXISTS "orders_paymentGroupId_idx" ON "orders"("paymentGroupId");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_opayRef_key" ON "orders"("opayRef");

-- AddForeignKey: orders -> PaymentGroup (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_paymentGroupId_fkey'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_paymentGroupId_fkey"
            FOREIGN KEY ("paymentGroupId") REFERENCES "PaymentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterEnum: add OPAY to PaymentMethod if not already present
DO $$ BEGIN
    ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'OPAY';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
