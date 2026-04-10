-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ENCARGADO', 'REEMPLAZO', 'TRABAJADOR');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM (
    'INGRESADA',
    'DERIVADA',
    'EN_PROCESO',
    'PENDIENTE_INFORMACION',
    'FINALIZADA',
    'CERRADA',
    'VENCIDA'
);

-- CreateEnum
CREATE TYPE "PrioridadSolicitud" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "AccionHistorialSolicitud" AS ENUM (
    'CREADA',
    'ASIGNADA',
    'DESASIGNADA',
    'DERIVADA',
    'ESTADO_CAMBIADO',
    'CERRADA'
);

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "RolUsuario" NOT NULL,
    "areaId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_solicitud" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "diasSla" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'INGRESADA',
    "prioridad" "PrioridadSolicitud" NOT NULL DEFAULT 'MEDIA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaCierre" TIMESTAMP(3),
    "creadoPorId" INTEGER NOT NULL,
    "asignadoAId" INTEGER,
    "areaActualId" INTEGER NOT NULL,
    "tipoSolicitudId" INTEGER NOT NULL,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_solicitudes" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "accion" "AccionHistorialSolicitud" NOT NULL,
    "estadoOrigen" "EstadoSolicitud",
    "estadoDestino" "EstadoSolicitud",
    "areaOrigenId" INTEGER,
    "areaDestinoId" INTEGER,
    "asignadoOrigenId" INTEGER,
    "asignadoDestinoId" INTEGER,
    "comentario" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_nombre_key" ON "areas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_areaId_idx" ON "usuarios"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_solicitud_nombre_key" ON "tipos_solicitud"("nombre");

-- CreateIndex
CREATE INDEX "solicitudes_creadoPorId_idx" ON "solicitudes"("creadoPorId");

-- CreateIndex
CREATE INDEX "solicitudes_asignadoAId_idx" ON "solicitudes"("asignadoAId");

-- CreateIndex
CREATE INDEX "solicitudes_areaActualId_idx" ON "solicitudes"("areaActualId");

-- CreateIndex
CREATE INDEX "solicitudes_tipoSolicitudId_idx" ON "solicitudes"("tipoSolicitudId");

-- CreateIndex
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");

-- CreateIndex
CREATE INDEX "historial_solicitudes_solicitudId_idx" ON "historial_solicitudes"("solicitudId");

-- CreateIndex
CREATE INDEX "historial_solicitudes_usuarioId_idx" ON "historial_solicitudes"("usuarioId");

-- CreateIndex
CREATE INDEX "historial_solicitudes_areaOrigenId_idx" ON "historial_solicitudes"("areaOrigenId");

-- CreateIndex
CREATE INDEX "historial_solicitudes_areaDestinoId_idx" ON "historial_solicitudes"("areaDestinoId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_areaActualId_fkey" FOREIGN KEY ("areaActualId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_tipoSolicitudId_fkey" FOREIGN KEY ("tipoSolicitudId") REFERENCES "tipos_solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_solicitudes" ADD CONSTRAINT "historial_solicitudes_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_solicitudes" ADD CONSTRAINT "historial_solicitudes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_solicitudes" ADD CONSTRAINT "historial_solicitudes_areaOrigenId_fkey" FOREIGN KEY ("areaOrigenId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_solicitudes" ADD CONSTRAINT "historial_solicitudes_areaDestinoId_fkey" FOREIGN KEY ("areaDestinoId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
