-- Conserva la trazabilidad historica: una solicitud no puede eliminar su historial por cascada.
ALTER TABLE "historial_solicitudes"
DROP CONSTRAINT "historial_solicitudes_solicitudId_fkey";

ALTER TABLE "historial_solicitudes"
ADD CONSTRAINT "historial_solicitudes_solicitudId_fkey"
FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
