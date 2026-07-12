-- ─────────────────────────────────────────
-- Migration : Module Pharmacie (V2)
-- ─────────────────────────────────────────

-- 1) Ajout du rôle PHARMACIST
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PHARMACIST';

-- 2) Ajout des nouveaux types de notifications
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STOCK_BAS';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MEDICAMENT_EXPIRE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DISPENSATION';

-- 3) Nouveaux enums pharmacie
CREATE TYPE "MedicationForm" AS ENUM (
  'COMPRIME',
  'GELULE',
  'SIROP',
  'SUSPENSION',
  'INJECTION',
  'POMMADE',
  'CREME',
  'GOUTTE',
  'SUPPOSITOIRE',
  'PATCH',
  'INHALATEUR',
  'SACHET',
  'AUTRE'
);

CREATE TYPE "StockMovementType" AS ENUM (
  'IN',
  'OUT',
  'ADJUSTMENT',
  'RETURN',
  'EXPIRED',
  'LOSS'
);

CREATE TYPE "PurchaseOrderStatus" AS ENUM (
  'DRAFT',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED'
);

CREATE TYPE "DispensationStatus" AS ENUM (
  'DISPENSED',
  'CANCELLED',
  'RETURNED'
);

-- 4) Catalogue médicaments
CREATE TABLE "Medication" (
  "id"                    SERIAL PRIMARY KEY,
  "name"                  TEXT NOT NULL,
  "dci"                   TEXT NOT NULL,
  "form"                  "MedicationForm" NOT NULL DEFAULT 'COMPRIME',
  "dosage"                TEXT NOT NULL,
  "unit"                  TEXT NOT NULL DEFAULT 'boîte',
  "category"              TEXT,
  "description"           TEXT,
  "barcode"               TEXT,
  "prescription_required" BOOLEAN NOT NULL DEFAULT true,
  "reorder_level"         INTEGER NOT NULL DEFAULT 10,
  "is_active"             BOOLEAN NOT NULL DEFAULT true,
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "Medication_barcode_key" ON "Medication"("barcode");
CREATE UNIQUE INDEX "Medication_dci_dosage_form_key" ON "Medication"("dci", "dosage", "form");
CREATE INDEX "Medication_name_idx" ON "Medication"("name");
CREATE INDEX "Medication_dci_idx" ON "Medication"("dci");
CREATE INDEX "Medication_category_idx" ON "Medication"("category");
CREATE INDEX "Medication_is_active_idx" ON "Medication"("is_active");

-- 5) Fournisseurs
CREATE TABLE "Supplier" (
  "id"             SERIAL PRIMARY KEY,
  "name"           TEXT NOT NULL,
  "contact_person" TEXT,
  "email"          TEXT,
  "phone"          TEXT NOT NULL,
  "address"        TEXT,
  "tax_id"         TEXT,
  "is_active"      BOOLEAN NOT NULL DEFAULT true,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");
CREATE INDEX "Supplier_is_active_idx" ON "Supplier"("is_active");

-- 6) Stocks (par lot)
CREATE TABLE "MedicationStock" (
  "id"            SERIAL PRIMARY KEY,
  "medication_id" INTEGER NOT NULL,
  "batch_number"  TEXT NOT NULL,
  "quantity"      INTEGER NOT NULL DEFAULT 0,
  "unit_cost"     DOUBLE PRECISION NOT NULL,
  "selling_price" DOUBLE PRECISION NOT NULL,
  "expiry_date"   TIMESTAMP(3) NOT NULL,
  "received_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "supplier_id"   INTEGER,
  "notes"         TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MedicationStock_medication_fk"
    FOREIGN KEY ("medication_id") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MedicationStock_supplier_fk"
    FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MedicationStock_medication_id_batch_number_key"
  ON "MedicationStock"("medication_id", "batch_number");
CREATE INDEX "MedicationStock_medication_id_idx" ON "MedicationStock"("medication_id");
CREATE INDEX "MedicationStock_expiry_date_idx" ON "MedicationStock"("expiry_date");
CREATE INDEX "MedicationStock_supplier_id_idx" ON "MedicationStock"("supplier_id");

-- 7) Mouvements de stock
CREATE TABLE "StockMovement" (
  "id"         SERIAL PRIMARY KEY,
  "stock_id"   INTEGER NOT NULL,
  "type"       "StockMovementType" NOT NULL,
  "quantity"   INTEGER NOT NULL,
  "reason"     TEXT,
  "reference"  TEXT,
  "user_id"    TEXT NOT NULL,
  "user_name"  TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_stock_fk"
    FOREIGN KEY ("stock_id") REFERENCES "MedicationStock"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "StockMovement_stock_id_idx" ON "StockMovement"("stock_id");
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX "StockMovement_created_at_idx" ON "StockMovement"("created_at");

-- 8) Bons de commande
CREATE TABLE "PurchaseOrder" (
  "id"            SERIAL PRIMARY KEY,
  "reference"     TEXT NOT NULL,
  "supplier_id"   INTEGER NOT NULL,
  "order_date"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expected_date" TIMESTAMP(3),
  "received_date" TIMESTAMP(3),
  "status"        "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "total_amount"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes"         TEXT,
  "created_by"    TEXT NOT NULL,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseOrder_supplier_fk"
    FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PurchaseOrder_reference_key" ON "PurchaseOrder"("reference");
CREATE INDEX "PurchaseOrder_supplier_id_idx" ON "PurchaseOrder"("supplier_id");
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX "PurchaseOrder_order_date_idx" ON "PurchaseOrder"("order_date");

CREATE TABLE "PurchaseOrderItem" (
  "id"                SERIAL PRIMARY KEY,
  "order_id"          INTEGER NOT NULL,
  "medication_id"     INTEGER NOT NULL,
  "quantity_ordered"  INTEGER NOT NULL,
  "quantity_received" INTEGER NOT NULL DEFAULT 0,
  "unit_cost"         DOUBLE PRECISION NOT NULL,
  "total_cost"        DOUBLE PRECISION NOT NULL,
  CONSTRAINT "PurchaseOrderItem_order_fk"
    FOREIGN KEY ("order_id") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PurchaseOrderItem_medication_fk"
    FOREIGN KEY ("medication_id") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PurchaseOrderItem_order_id_idx" ON "PurchaseOrderItem"("order_id");
CREATE INDEX "PurchaseOrderItem_medication_id_idx" ON "PurchaseOrderItem"("medication_id");

-- 9) Dispensations (délivrances au patient)
CREATE TABLE "Dispensation" (
  "id"                SERIAL PRIMARY KEY,
  "reference"         TEXT NOT NULL,
  "patient_id"        TEXT NOT NULL,
  "medical_record_id" INTEGER,
  "dispensed_by"      TEXT NOT NULL,
  "dispensed_by_name" TEXT NOT NULL,
  "dispensed_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes"             TEXT,
  "total_amount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"            "DispensationStatus" NOT NULL DEFAULT 'DISPENSED',
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Dispensation_patient_fk"
    FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Dispensation_medical_record_fk"
    FOREIGN KEY ("medical_record_id") REFERENCES "MedicalRecords"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Dispensation_reference_key" ON "Dispensation"("reference");
CREATE INDEX "Dispensation_patient_id_idx" ON "Dispensation"("patient_id");
CREATE INDEX "Dispensation_medical_record_id_idx" ON "Dispensation"("medical_record_id");
CREATE INDEX "Dispensation_dispensed_at_idx" ON "Dispensation"("dispensed_at");
CREATE INDEX "Dispensation_status_idx" ON "Dispensation"("status");

CREATE TABLE "DispensationItem" (
  "id"              SERIAL PRIMARY KEY,
  "dispensation_id" INTEGER NOT NULL,
  "stock_id"        INTEGER NOT NULL,
  "medication_id"   INTEGER NOT NULL,
  "quantity"        INTEGER NOT NULL,
  "unit_price"      DOUBLE PRECISION NOT NULL,
  "total_price"     DOUBLE PRECISION NOT NULL,
  "instructions"    TEXT,
  CONSTRAINT "DispensationItem_dispensation_fk"
    FOREIGN KEY ("dispensation_id") REFERENCES "Dispensation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DispensationItem_stock_fk"
    FOREIGN KEY ("stock_id") REFERENCES "MedicationStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DispensationItem_medication_fk"
    FOREIGN KEY ("medication_id") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "DispensationItem_dispensation_id_idx" ON "DispensationItem"("dispensation_id");
CREATE INDEX "DispensationItem_stock_id_idx" ON "DispensationItem"("stock_id");
CREATE INDEX "DispensationItem_medication_id_idx" ON "DispensationItem"("medication_id");
