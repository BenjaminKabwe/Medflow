-- Add sender_id and read_at columns to Notification
ALTER TABLE "Notification" ADD COLUMN "sender_id" TEXT;
ALTER TABLE "Notification" ADD COLUMN "read_at" TIMESTAMP(3);

-- Create new NotificationType enum with French values
CREATE TYPE "NotificationType_new" AS ENUM ('INFO', 'NOUVEAU_RENDEZ_VOUS', 'RENDEZ_VOUS_CONFIRME', 'RENDEZ_VOUS_ANNULE', 'RENDEZ_VOUS_MODIFIE', 'PAIEMENT_RECU');

-- Migrate existing data: map old English values to new French equivalents
ALTER TABLE "Notification" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE "NotificationType_new"
  USING (
    CASE "type"::text
      WHEN 'APPOINTMENT_BOOKED'    THEN 'NOUVEAU_RENDEZ_VOUS'::"NotificationType_new"
      WHEN 'APPOINTMENT_CONFIRMED' THEN 'RENDEZ_VOUS_CONFIRME'::"NotificationType_new"
      WHEN 'APPOINTMENT_CANCELLED' THEN 'RENDEZ_VOUS_ANNULE'::"NotificationType_new"
      ELSE 'INFO'::"NotificationType_new"
    END
  );
ALTER TABLE "Notification" ALTER COLUMN "type" SET DEFAULT 'INFO';

-- Drop old enum and rename new one
DROP TYPE "NotificationType";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";

-- Add foreign key constraint for appointment_id -> Appointment
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
