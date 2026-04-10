-- AlterEnum
ALTER TYPE "AccionHistorialSolicitud" ADD VALUE IF NOT EXISTS 'FINALIZADA';
ALTER TYPE "AccionHistorialSolicitud" ADD VALUE IF NOT EXISTS 'ELIMINADA';

-- AlterTable
ALTER TABLE "solicitudes" ADD COLUMN "eliminadoEn" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "solicitudes_eliminadoEn_idx" ON "solicitudes"("eliminadoEn");
