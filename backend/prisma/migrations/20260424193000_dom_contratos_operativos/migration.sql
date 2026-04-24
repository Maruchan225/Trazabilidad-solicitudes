WITH maximos AS (
  SELECT COALESCE(MAX("correlativo"), 0) AS max_correlativo
  FROM "solicitudes"
),
pendientes AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "id") AS secuencia
  FROM "solicitudes"
  WHERE "correlativo" IS NULL
)
UPDATE "solicitudes" AS s
SET "correlativo" = maximos.max_correlativo + pendientes.secuencia
FROM pendientes
CROSS JOIN maximos
WHERE s."id" = pendientes."id";

UPDATE "solicitudes"
SET "canalIngreso" = 'PRESENCIAL'
WHERE "canalIngreso" IS NULL;

ALTER TABLE "solicitudes"
ALTER COLUMN "correlativo" SET NOT NULL;

ALTER TABLE "solicitudes"
ALTER COLUMN "canalIngreso" SET NOT NULL;
