-- AlterEnum
ALTER TYPE "AccionHistorialSolicitud" ADD VALUE IF NOT EXISTS 'OBSERVACION';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "contrasena" TEXT NOT NULL DEFAULT '$2b$10$6wqNQvGdJY3wZLPNXv51YeKxVhfdIsVY4lYfTqkQx1fO8Y1M5bWLy';
