-- Endurece el flujo DOM para registros nuevos sin destruir datos heredados.
-- NOT VALID conserva filas historicas existentes, pero obliga nuevos inserts/updates.

ALTER TABLE "solicitudes"
ADD CONSTRAINT "solicitudes_asignado_requerido_nuevo_chk"
CHECK ("asignadoAId" IS NOT NULL) NOT VALID;

ALTER TABLE "tipos_solicitud"
ADD CONSTRAINT "tipos_solicitud_dias_sla_requerido_chk"
CHECK ("diasSla" IS NOT NULL AND "diasSla" >= 1) NOT VALID;
