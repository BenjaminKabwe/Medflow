-- ─────────────────────────────────────────
-- Migration : Module Laboratoire (analyses) V2
-- Assouplit LabTest pour le flux demande → résultat et ajoute la
-- traçabilité (demandeur / technicien). Ajoute une catégorie aux services.
-- ─────────────────────────────────────────

-- 1) Résultat et date de réalisation deviennent facultatifs
--    (une analyse REQUESTED n'a pas encore de résultat).
ALTER TABLE "LabTest" ALTER COLUMN "result" DROP NOT NULL;
ALTER TABLE "LabTest" ALTER COLUMN "test_date" DROP NOT NULL;

-- 2) Traçabilité + horodatage de complétion
ALTER TABLE "LabTest" ADD COLUMN "requested_by" TEXT;
ALTER TABLE "LabTest" ADD COLUMN "requested_by_name" TEXT;
ALTER TABLE "LabTest" ADD COLUMN "performed_by" TEXT;
ALTER TABLE "LabTest" ADD COLUMN "performed_by_name" TEXT;
ALTER TABLE "LabTest" ADD COLUMN "completed_at" TIMESTAMP(3);

-- 3) Catégorie de service (ex : LABORATORY) pour filtrer le catalogue d'analyses
ALTER TABLE "Services" ADD COLUMN "category" TEXT;
