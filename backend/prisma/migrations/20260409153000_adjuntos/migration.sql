-- AlterEnum
ALTER TYPE "AccionHistorialSolicitud" ADD VALUE IF NOT EXISTS 'ADJUNTO_SUBIDO';
ALTER TYPE "AccionHistorialSolicitud" ADD VALUE IF NOT EXISTS 'ADJUNTO_ELIMINADO';

-- CreateTable
CREATE TABLE "adjuntos" (
    "id" SERIAL NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solicitudId" INTEGER NOT NULL,
    "subidoPorId" INTEGER,

    CONSTRAINT "adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adjuntos_solicitudId_idx" ON "adjuntos"("solicitudId");

-- CreateIndex
CREATE INDEX "adjuntos_subidoPorId_idx" ON "adjuntos"("subidoPorId");

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
