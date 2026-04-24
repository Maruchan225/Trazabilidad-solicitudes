-- CreateEnum
CREATE TYPE "CanalIngreso" AS ENUM ('PRESENCIAL', 'CORREO');

-- AlterTable
ALTER TABLE "solicitudes"
ADD COLUMN "canalIngreso" "CanalIngreso",
ADD COLUMN "correlativo" INTEGER,
ADD COLUMN "numeroSolicitud" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_correlativo_key" ON "solicitudes"("correlativo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_numeroSolicitud_key" ON "solicitudes"("numeroSolicitud");
