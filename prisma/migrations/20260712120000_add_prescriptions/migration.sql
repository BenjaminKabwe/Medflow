-- ─────────────────────────────────────────
-- Migration : Ordonnances (Prescriptions) V2
-- ─────────────────────────────────────────

-- 1) Nouvel enum statut d'ordonnance
CREATE TYPE "PrescriptionStatus" AS ENUM (
  'PENDING',
  'PARTIALLY_DISPENSED',
  'DISPENSED',
  'CANCELLED'
);

-- 2) Table Prescription
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "medical_record_id" INTEGER,
    "appointment_id" INTEGER,
    "doctor_id" TEXT NOT NULL,
    "doctor_name" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Prescription_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prescription_medical_record_id_fkey"
        FOREIGN KEY ("medical_record_id") REFERENCES "MedicalRecords"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prescription_doctor_id_fkey"
        FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Prescription_reference_key" ON "Prescription"("reference");
CREATE INDEX "Prescription_patient_id_idx" ON "Prescription"("patient_id");
CREATE INDEX "Prescription_doctor_id_idx" ON "Prescription"("doctor_id");
CREATE INDEX "Prescription_medical_record_id_idx" ON "Prescription"("medical_record_id");
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");
CREATE INDEX "Prescription_created_at_idx" ON "Prescription"("created_at");

-- 3) Table PrescriptionItem
CREATE TABLE "PrescriptionItem" (
    "id" SERIAL NOT NULL,
    "prescription_id" INTEGER NOT NULL,
    "medication_id" INTEGER NOT NULL,
    "quantity_prescribed" INTEGER NOT NULL,
    "quantity_dispensed" INTEGER NOT NULL DEFAULT 0,
    "dosage" TEXT NOT NULL,
    "duration" TEXT,
    "instructions" TEXT,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PrescriptionItem_prescription_id_fkey"
        FOREIGN KEY ("prescription_id") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrescriptionItem_medication_id_fkey"
        FOREIGN KEY ("medication_id") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PrescriptionItem_prescription_id_idx" ON "PrescriptionItem"("prescription_id");
CREATE INDEX "PrescriptionItem_medication_id_idx" ON "PrescriptionItem"("medication_id");

-- 4) Lien Dispensation → Prescription
ALTER TABLE "Dispensation" ADD COLUMN "prescription_id" INTEGER;

ALTER TABLE "Dispensation" ADD CONSTRAINT "Dispensation_prescription_id_fkey"
    FOREIGN KEY ("prescription_id") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Dispensation_prescription_id_idx" ON "Dispensation"("prescription_id");
