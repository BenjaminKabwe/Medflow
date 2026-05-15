-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'MOBILE_MONEY';
ALTER TYPE "PaymentMethod" ADD VALUE 'INSURANCE';
ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cashier_id" TEXT,
ADD COLUMN     "cashier_name" TEXT,
ADD COLUMN     "session_id" INTEGER;

-- CreateTable
CREATE TABLE "PaymentMethodConfig" (
    "id" SERIAL NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethodConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashierSession" (
    "id" SERIAL NOT NULL,
    "cashier_id" TEXT NOT NULL,
    "cashier_name" TEXT NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opening_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closing_amount" DOUBLE PRECISION,
    "total_cash" DOUBLE PRECISION,
    "total_card" DOUBLE PRECISION,
    "total_mobile" DOUBLE PRECISION,
    "total_insurance" DOUBLE PRECISION,
    "total_transfer" DOUBLE PRECISION,
    "notes" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "CashierSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethodConfig_method_key" ON "PaymentMethodConfig"("method");

-- CreateIndex
CREATE INDEX "CashierSession_cashier_id_idx" ON "CashierSession"("cashier_id");

-- CreateIndex
CREATE INDEX "CashierSession_status_idx" ON "CashierSession"("status");

-- CreateIndex
CREATE INDEX "CashierSession_opened_at_idx" ON "CashierSession"("opened_at");

-- CreateIndex
CREATE INDEX "Payment_session_id_idx" ON "Payment"("session_id");

-- CreateIndex
CREATE INDEX "Payment_cashier_id_idx" ON "Payment"("cashier_id");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "CashierSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
