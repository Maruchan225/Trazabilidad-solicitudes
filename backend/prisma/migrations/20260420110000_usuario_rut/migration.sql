ALTER TABLE "usuarios" ADD COLUMN "rut" TEXT;

UPDATE "usuarios"
SET "rut" = CONCAT((10000000 + "id")::text, '-0')
WHERE "rut" IS NULL;

ALTER TABLE "usuarios" ALTER COLUMN "rut" SET NOT NULL;

CREATE UNIQUE INDEX "usuarios_rut_key" ON "usuarios"("rut");
